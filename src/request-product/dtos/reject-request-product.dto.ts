import { IsNotEmpty, IsString } from "class-validator";

export class RejectRequestProductDto {
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}