import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class DiscountDto {
  @IsNumber()
  amount: number;

  @IsString()
  description: string;
}

export class AddSubscriptionDto {
  @IsString()
  userId: string;

  @IsString()
  planId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  @IsOptional()
  userReferralCode?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => DiscountDto)
  discount?: DiscountDto;
}
