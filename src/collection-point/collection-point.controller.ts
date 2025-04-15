// src/collection-points/collection-point.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import { CollectionPointService } from './collection-point.service';
import { CreateCollectionPointDto } from './dto/create-collection-point.dto';
import { UpdateCollectionPointDto } from './dto/update-collection-point.dto';
import { ReviewPointDto } from './dto/review-point.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth-module/auth.guard';
import { CollectionPoint } from './entities/collection-point.entity';
import { PaginatedCollectionPoint } from './dto/paginated-collection-point.dto';

@Controller('collection-point')
export class CollectionPointController {
  constructor(
    private readonly collectionPointService: CollectionPointService,
  ) {}

  @Get('/find')
  findByStatus(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedCollectionPoint> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    if (status) {
      return this.collectionPointService.findByStatusPaginated(
        status,
        pageNum,
        limitNum,
      );
    }
    return this.collectionPointService.findAllPaginated(pageNum, limitNum);
  }

  @Get()
  findAll(): Promise<CollectionPoint[]> {
    return this.collectionPointService.findAll();
  }

  @Get('/search')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  search(@Query('name') name: string): Promise<CollectionPoint[]> {
    return this.collectionPointService.searchName(name);
  }

  @Get(':id')
  async findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    id: number,
  ) {
    return this.collectionPointService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  create(
    @Body() createDto: CreateCollectionPointDto,
  ): Promise<CollectionPoint> {
    return this.collectionPointService.create(createDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCollectionPointDto,
  ): Promise<CollectionPoint> {
    return this.collectionPointService.update(+id, updateDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return await this.collectionPointService.remove(+id);
  }

  @Patch(':id/review')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  review(
    @Param('id') id: string,
    @Body() reviewDto: ReviewPointDto,
  ): Promise<CollectionPoint> {
    return this.collectionPointService.reviewCollectionPoint(+id, reviewDto);
  }
}
