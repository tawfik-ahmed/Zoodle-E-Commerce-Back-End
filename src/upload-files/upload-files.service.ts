import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary-response';
import * as streamifier from 'streamifier';
import { Multer } from 'multer';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadFilesService {
  constructor() {}

  /**
   * Uploads a file to Cloudinary
   * @param {Multer.File} file
   * @returns {Promise<CloudinaryResponse>}
   */
  public uploadFile(
    file: Express.Multer.File,
    folder: string,
    publicId: string,
  ): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          overwrite: true,
          unique_filename: false,
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result!);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Deletes a file from Cloudinary
   * @param {string} folder
   * @param {string} publicId
   * @returns {Promise<CloudinaryResponse>}
   */
  public deleteFile(folder: string, publicId: string) {
    return cloudinary.uploader.destroy(`${folder}/${publicId}`);
  }

  /**
   * Deletes a folder from Cloudinary
   * @param {string} folder
   * @returns {Promise<CloudinaryResponse>}
   */
  public async deleteFolder(folder: string) {
    await cloudinary.api.delete_resources_by_prefix(folder);
    return cloudinary.api.delete_folder(folder);
  }

  /**
   * Uploads a profile image to Cloudinary
   * @param {Multer.File} file
   * @param {string} userId
   * @returns {Promise<CloudinaryResponse>}
   */
  public async uploadProfileImage(file: Express.Multer.File, userId: string) {
    await this.deleteFile('Profile-Images', userId);
    return this.uploadFile(file, 'Profile-Images', userId);
  }

  /**
   * Uploads a product cover to Cloudinary
   * @param {Multer.File} file
   * @param {string} productName
   * @returns {Promise<CloudinaryResponse>}
   */
  public async uploadProductCover(
    file: Express.Multer.File,
    productName: string,
  ) {
    await this.deleteFile('Product-Covers', productName);
    return this.uploadFile(file, 'Product-Covers', productName);
  }

  /**
   * Uploads a category image to Cloudinary
   * @param {Multer.File} file
   * @param {string} categoryName
   * @returns {Promise<CloudinaryResponse>}
   */
  public async uploadCategoryImage(
    file: Express.Multer.File,
    categoryName: string,
  ) {
    await this.deleteFile('Category-Images', categoryName);
    return this.uploadFile(file, 'Category-Images', categoryName);
  }

  /**
   * Uploads a subcategory image to Cloudinary
   * @param {Multer.File} file
   * @param {string} subCategoryName
   * @returns {Promise<CloudinaryResponse>}
   */
  public async uploadSubCategoryImage(
    file: Express.Multer.File,
    subCategoryName: string,
  ) {
    await this.deleteFile('SubCategory-Images', subCategoryName);
    return this.uploadFile(file, 'SubCategory-Images', subCategoryName);
  }

  /**
   * Uploads a request product cover to Cloudinary
   * @param {Multer.File} file
   * @param {string} productName
   * @returns {Promise<CloudinaryResponse>}
   */
  public async uploadRequestProductCoverImage(
    file: Express.Multer.File,
    productName: string,
  ) {
    await this.deleteFile('Request-Product-Covers', productName);
    return this.uploadFile(file, 'Request-Product-Covers', productName);
  }

  /**
   * Uploads multiple product images to Cloudinary
   * @param {Multer.File[]} files
   * @param {string} productName
   * @returns {Promise<CloudinaryResponse[]>}
   */
  public uploadProductImages(
    files: Express.Multer.File[],
    productName: string,
  ) {
    return Promise.all(
      files.map((file, _) =>
        this.uploadFile(file, `Products/${productName}`, randomUUID()),
      ),
    );
  }

  /**
   * Deletes a profile image from Cloudinary
   * @param {string} userId
   * @returns {Promise<CloudinaryResponse>}
   */
  public deleteProfileImage(userId: string) {
    return this.deleteFile('Profile-Images', userId);
  }

  /**
   * Deletes a product cover from Cloudinary
   * @param {string} productName
   * @returns {Promise<CloudinaryResponse>}
   */
  public deleteProductCover(productName: string) {
    return this.deleteFile('Product-Covers', productName);
  }

  /**
   * Deletes multiple product images from Cloudinary
   * @param {string[]} publicIds
   * @returns {Promise<CloudinaryResponse>}
   */
  public deleteProductImages(publicIds: string[]) {
    return cloudinary.api.delete_resources(publicIds);
  }
}
