import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AddMemberDto } from './dto/add-member.dto.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { GroupsService } from './groups.service.js';

@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() data: CreateGroupDto) {
    return this.groupsService.createGroup(userId, data);
  }

  @Get()
  list(@CurrentUser('sub') userId: string) {
    return this.groupsService.listGroups(userId);
  }

  @Post(':id/members')
  addMember(
    @Param('id', ParseUUIDPipe) groupId: string,
    @CurrentUser('sub') userId: string,
    @Body() data: AddMemberDto,
  ) {
    return this.groupsService.addMember(groupId, userId, data);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) memberId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.groupsService.removeMember(groupId, userId, memberId);
  }
}
