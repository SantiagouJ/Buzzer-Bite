import {
  ArgumentsHost,
  Body,
  Catch,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthActor } from "../auth/auth-actor";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/entities/user.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { requestValidationPipe } from "../common/request-validation.pipe";
import { CreateStoreDto } from "./dto/create-store.dto";
import { NearbyStoreDto } from "./dto/nearby-store.dto";
import { UpdateStoreDto } from "./dto/update-store.dto";
import { StoreImage, StoresService } from "./stores.service";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Catch()
class StoreImageExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const multerCode =
      exception &&
      typeof exception === "object" &&
      (exception as { name?: string }).name === "MulterError"
        ? (exception as { code?: string }).code
        : undefined;

    if (multerCode === "LIMIT_FILE_SIZE") {
      const response = host.switchToHttp().getResponse<{
        status: (code: number) => { json: (body: unknown) => void };
      }>();
      response.status(400).json({
        statusCode: 400,
        message: "La imagen no puede superar 5 MB",
      });
      return;
    }

    super.catch(exception, host);
  }
}

@Controller("stores")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONSUMER, UserRole.MERCHANT)
@UseFilters(StoreImageExceptionFilter)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @Roles(UserRole.MERCHANT)
  @UseInterceptors(FileInterceptor("image", { limits: { fileSize: MAX_IMAGE_BYTES } }))
  create(
    @Req() request: { user: AuthActor },
    @UploadedFile() image: StoreImage | undefined,
    @Body(requestValidationPipe) createStoreDto: CreateStoreDto,
  ) {
    return this.storesService.create(createStoreDto, request.user, image);
  }

  @Get()
  findAll() {
    return this.storesService.findAll();
  }

  @Get("nearby")
  findNearby(@Query(requestValidationPipe) query: NearbyStoreDto) {
    return this.storesService.findNearby(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.storesService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.MERCHANT)
  @UseInterceptors(FileInterceptor("image", { limits: { fileSize: MAX_IMAGE_BYTES } }))
  update(
    @Req() request: { user: AuthActor },
    @UploadedFile() image: StoreImage | undefined,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(requestValidationPipe) updateStoreDto: UpdateStoreDto,
  ) {
    return this.storesService.update(id, updateStoreDto, request.user, image);
  }
}
