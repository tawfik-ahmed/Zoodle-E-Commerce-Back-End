import {
  Body,
  Controller,
  Delete,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UploadFilesService } from './upload-files.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../user/decorators/roles.decorator';
import { UserRole } from '../utils/enums';
import { Multer } from 'multer';
import {
  createImagesUploadPipe,
  createImageUploadPipe,
} from './pipes/file-upload.pipe';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import type { JwtPayloadType } from '../utils/types';

// ~api/v1/images
@Controller('upload-files')
export class UploadFilesController {
  constructor(private readonly uploadFilesService: UploadFilesService) {}

  @Post('profile-image')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  public uploadImage(
    @UploadedFile(createImageUploadPipe(1 * 1024 * 1024))
    file: Express.Multer.File,
    @CurrentUser() payload: JwtPayloadType,
  ) {
    return this.uploadFilesService.uploadProfileImage(
      file,
      payload.id.toString(),
    );
  }

  @Delete('profile-image')
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  public deleteProfileImage(@CurrentUser() payload: JwtPayloadType) {
    return this.uploadFilesService.deleteProfileImage(payload.id.toString());
  }

  @Post('product-cover')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN)
  public uploadProductCover(
    @UploadedFile(createImageUploadPipe(1 * 1024 * 1024))
    file: Express.Multer.File,
    @Body('productName') productName: string,
  ) {
    return this.uploadFilesService.uploadProductCover(file, productName);
  }

  @Delete('product-cover')
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN)
  public deleteProductCover(@Body('productName') productName: string) {
    return this.uploadFilesService.deleteProductCover(productName);
  }

  @Post('category-image')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN)
  public uploadCategoryImage(
    @UploadedFile(createImageUploadPipe(1 * 1024 * 1024))
    file: Express.Multer.File,
    @Body('categoryName') categoryName: string,
  ) {
    return this.uploadFilesService.uploadCategoryImage(file, categoryName);
  }

  @Post('subcategory-image')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN)
  public uploadSubCategoryImage(
    @UploadedFile(createImageUploadPipe(1 * 1024 * 1024))
    file: Express.Multer.File,
    @Body('subCategoryName') subCategoryName: string,
  ) {
    return this.uploadFilesService.uploadSubCategoryImage(
      file,
      subCategoryName,
    );
  }

  @Post('product-images')
  @UseInterceptors(FilesInterceptor('file[]', 5))
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN)
  public uploadProductImages(
    @UploadedFiles(createImagesUploadPipe(1 * 1024 * 1024))
    files: Array<Express.Multer.File>,
    @Body('productName') productName: string,
  ) {
    return this.uploadFilesService.uploadProductImages(files, productName);
  }

  @Delete('product-images')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public deleteProductImages(@Body('publicIds') publicIds: string[]) {
    return this.uploadFilesService.deleteProductImages(publicIds);
  }

  @Post('request-product-cover-image')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(UserRole.ADMIN, UserRole.SUPPLIER)
  @UseGuards(AuthGuard)
  public uploadRequestProductCoverImage(
    @UploadedFile(createImageUploadPipe(1 * 1024 * 1024))
    file: Express.Multer.File,
    @Body('productName') productName: string,
  ) {
    return this.uploadFilesService.uploadRequestProductCoverImage(
      file,
      productName,
    );
  }
}
