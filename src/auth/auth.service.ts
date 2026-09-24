import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { User } from '../user/entites/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from './dtos/sign-up.dto';
import { SignInDto } from './dtos/sign-in.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { randomBytes } from 'crypto';
import { FRONTEND_URL } from '../utils/constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Signs up a new user.
   *
   * @throws {BadRequestException} If a user with the same email already exists.
   *
   * @param {AuthDto} dto - User data.
   * @returns {Promise<{ ok: boolean, message: string, data: User }>} - Object with ok property, jwt token and user data.
   */
  public async signUp(dto: SignUpDto): Promise<{
    ok: boolean;
    message: string;
    data: User;
  }> {
    const isUserExists = await this.userService.isExistsByEmail(dto.email);

    if (isUserExists) {
      throw new BadRequestException({
        ok: false,
        message: 'User already exists, please sign in',
      });
    }
    
    const hashedPassword = await this.generateHashedPassword(dto.password);
    const emailVerificationToken = this.generateEmailVerificationToken();

    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
      isActive: false,
      emailVerificationToken,
      emailVerificationTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    await this.userRepository.save(user);

    await this.sendEmailVerficationLink(user.email, emailVerificationToken);

    return {
      ok: true,
      message: 'User created successfully, please verify your email',
      data: user,
    };
  }

  /**
   * Signs in an existing user.
   *
   * @throws {BadRequestException} If user does not exist.
   * @throws {BadRequestException} If password is incorrect.
   *
   * @param {SignInDto} dto - User data.
   * @returns {Promise<{ ok: boolean, access_token: string, refresh_token: string, message: string, data: User }>} - Object with ok property, jwt token and user data.
   */
  public async signIn(dto: SignInDto): Promise<{
    ok: boolean;
    access_token: string;
    refresh_token: string;
    message: string;
    data: User;
  }> {
    const user = await this.userService.getUserByEmail(dto.email);

    if (!user) {
      throw new BadRequestException({ ok: false, message: 'User not found' });
    }

    const isPasswordMatch = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordMatch) {
      throw new BadRequestException({
        ok: false,
        message: 'Incorrect password',
      });
    }

    if (!user.isActive) {
      const emailVerificationToken = this.generateEmailVerificationToken();

      user.emailVerificationToken = emailVerificationToken;
      user.emailVerificationTokenExpiresAt = new Date(
        Date.now() + 15 * 60 * 1000,
      );

      await this.userRepository.save(user);
      await this.sendEmailVerficationLink(user.email, emailVerificationToken);

      throw new BadRequestException({
        ok: false,
        message:
          'Please verify your email. A new verification link has been sent.',
      });
    }

    const accessToken = await this.generateJwtAccessToken(user);
    const refreshToken = await this.generateJwtRefreshToken(user);

    return {
      ok: true,
      access_token: accessToken,
      refresh_token: refreshToken,
      message: 'User signed in successfully',
      data: user,
    };
  }

  /**
   * Resets the password for the given user.
   *
   * @param {ResetPasswordDto} dto - User data.
   * @returns {Promise<{ ok: boolean, message: string }>} - Object with ok property and success message.
   */
  public async resetPassword(
    dto: ResetPasswordDto,
  ): Promise<{ ok: boolean; message: string }> {
    const { email } = dto;
    const user = await this.userService.getUserByEmail(email);
    const verificationCode = this.generateVerificationCode();
    user.verificationCode = verificationCode;
    await this.userRepository.save(user);

    await this.mailerService.sendMail({
      from: `Zoodle E-Commerce <${this.config.get<string>('GMAIL_USER')}>`,
      to: email,
      subject: 'Zoodle E-Commerce - Reset Password',
      html: `<div>
        <h1>Forgot your password? If you didn't request a password reset, you can safely ignore this email.</h1>
        <p>Verification Code: 
          <span style="font-weight: bold; font-size: 24px; color: red;">${verificationCode}</span>
        </p>
        <p>Don't share this code with anyone.</p>
        <p>Thank you for using our service!</p>
        <p>Best regards,<br/>Zoodle E-Commerce</p>
      </div>`,
    });

    return {
      ok: true,
      message: `Verification code sent successfully on your email ${email}`,
    };
  }

  /**
   * Change the password for the given user.
   *
   * @param {SignInDto} dto - User data.
   * @returns {Promise<{ ok: boolean, message: string }>} - Object with ok property and success message.
   * @throws {BadRequestException} If the verification code is incorrect.
   */
  public async changePassword(
    dto: SignInDto,
  ): Promise<{ ok: boolean; message: string }> {
    const { email, password: newPassword } = dto;
    const user = await this.userService.getUserByEmail(email);

    if (!user.isCodeVerified) {
      throw new BadRequestException({
        ok: false,
        message: 'Please verify your code first',
      });
    }

    const isSame = await bcrypt.compare(newPassword, user.password);

    if (isSame) {
      throw new BadRequestException({
        ok: false,
        message: 'New password must be different from the old one',
      });
    }

    const hashedPassword = await this.generateHashedPassword(newPassword);
    user.password = hashedPassword;
    user.isCodeVerified = false;

    await this.userRepository.save(user);
    return { ok: true, message: 'Password changed successfully' };
  }

  /**
   * Refreshes the access token for the given refresh token.
   *
   * @param {string} refreshToken - Refresh token.
   * @returns {Promise<{ ok: boolean, access_token: string}>} - Object with ok property, access token
   * @throws {BadRequestException} If the refresh token is invalid.
   */
  public async refreshToken(
    refreshToken: string,
  ): Promise<{ ok: boolean; access_token: string }> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });

      const { iat, exp, ...user } = payload;
      const accessToken = await this.generateJwtAccessToken(user as User);

      return {
        ok: true,
        access_token: accessToken,
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        message: 'please login again',
      });
    }
  }

  /**
   * Verify the verification code for the given user.
   *
   * @throws {BadRequestException} If the verification code is incorrect.
   *
   * @param {string} email - Email of the user to verify.
   * @param {string} verificationCode - Verification code to verify.
   * @returns {Promise<{ ok: boolean; message: string }>} - Object with ok property and success message.
   */
  public async verifyVerificationCode(
    email: string,
    verificationCode: string,
  ): Promise<{ ok: boolean; message: string }> {
    const user = await this.userService.getUserByEmail(email);

    if (user.verificationCode !== verificationCode) {
      throw new BadRequestException({
        ok: false,
        message: 'Incorrect code',
      });
    }

    user.verificationCode = null!;
    user.isCodeVerified = true;

    await this.userRepository.save(user);
    return { ok: true, message: 'code verified successfully' };
  }

  /**
   * Verify the email for the given user.
   *
   * @param {string} email - Email of the user to verify.
   * @param {string} token - Email verification token.
   * @returns {Promise<{ ok: boolean; message: string }>} - Object with ok property and success message.
   */
  public async verifyEmail(email: string, token: string) {
    const user = await this.userService.getUserByEmail(email);

    if (!user) {
      throw new BadRequestException({
        ok: false,
        message: 'Invalid verification link',
      });
    }

    if (user.isActive) {
      return {
        ok: true,
        message: 'Email is already verified',
      };
    }

    if (user.emailVerificationToken !== token) {
      console.log(token);
      console.log(user.emailVerificationToken);
      throw new BadRequestException({
        ok: false,
        message: 'Invalid verification link',
      });
    }

    if (
      !user.emailVerificationTokenExpiresAt ||
      user.emailVerificationTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException({
        ok: false,
        message: 'Verification link has expired, please try to login again',
      });
    }

    user.isActive = true;
    user.emailVerificationToken = null!;
    user.emailVerificationTokenExpiresAt = null!;

    await this.userRepository.save(user);

    return {
      ok: true,
      message: 'Email verified successfully, you can now login',
    };
  }

  /**
   * Generates a verification code as a string of 6 digits, between 100000 and 999999.
   * This code is used to verify the user's email address during the sign up process.
   */
  private generateVerificationCode(): string {
    return Math.floor(Math.random() * 900000 + 100000).toString();
  }

  /**
   * Generates a hashed password based on the given password and the salt.
   *
   * @param {string} password - Password to hash.
   * @returns {Promise<string>} - Hashed password.
   */
  public async generateHashedPassword(password: string): Promise<string> {
    const salt = Number(this.config.get<string>('SALT'));
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  }

  /**
   * Generates a jwt access token based on the given user data.
   *
   * @param {User} user - User data.
   * @returns {Promise<string>} - Jwt token.
   */
  public async generateJwtAccessToken(user: User): Promise<string> {
    const payload = { id: user.id, role: user.role };
    return this.jwtService.signAsync(payload);
  }

  /**
   * Generates a jwt refresh token based on the given user data.
   *
   * @param {User} user - User data.
   * @returns {Promise<string>} - Jwt token.
   */
  public async generateJwtRefreshToken(user: User): Promise<string> {
    const payload = { id: user.id, role: user.role };
    return this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_TOKEN_SECRET')!,
      expiresIn: this.config.get<string>(
        'JWT_REFRESH_TOKEN_EXPIRES_IN',
      )! as any,
    });
  }

  /**
   * Generates a random email verification token.
   */
  public generateEmailVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Sends an email verification link to the user's email address.
   *
   * @param {string} email - Email address of the user.
   * @param {string} token - Email verification token.
   * @returns {Promise<void>}
   * @throws {Error} If the email verification link could not be sent.
   * */
  private async sendEmailVerficationLink(email: string, token: string) {
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    await this.mailerService.sendMail({
      from: `Zoodle E-Commerce <${this.config.get<string>('GMAIL_USER')}>`,
      to: email,
      subject: 'Zoodle E-Commerce - Verify Your Email',
      html: `<div>
      <h1>Welcome to Zoodle E-Commerce!</h1>

      <p>Please verify your email address by clicking the link below:</p>

      <a
        href="${verificationUrl}"
        style="
          display: inline-block;
          padding: 12px 20px;
          background: #000;
          color: #fff;
          text-decoration: none;
          border-radius: 6px;
        "
      >
        Verify Your Email
      </a>

      <p>This verification link will expire in 15 minutes.</p>

      <p>Thank you for using our service!</p>
      <p>Best regards,<br/>Zoodle E-Commerce</p>
    </div>`,
    });
  }
}
