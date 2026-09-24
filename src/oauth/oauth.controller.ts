import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { OAuthService } from './ouath.service';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { FRONTEND_URL } from '../utils/constants';
import passport from 'passport';

// ~ api/v1/oauth
@Controller('oauth')
export class OAuthController {
  constructor(
    private readonly oauthService: OAuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google/sign')
  @UseGuards(AuthGuard('google'))
  public googleLogin( @Query('redirect') redirect: string,@Req() req: Request,
    @Res() res: Response,) {
    return passport.authenticate('google', {
      scope: ['profile', 'email'],
      state: redirect || '/',
    })(req, res);
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  public async googleLoginCallback(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { profile } = req.user;

    const { access_token, refresh_token, ...rest } =
      await this.oauthService.validateUser({
        userId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        avatar: profile.photos?.[0]?.value ?? '',
      });

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/api/v1/auth/refresh-token',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const frontendUrl = FRONTEND_URL;
    const redirectUrl = req.query.state || frontendUrl;

    return res.redirect(redirectUrl);
  }
}
