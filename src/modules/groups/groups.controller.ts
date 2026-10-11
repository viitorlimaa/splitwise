import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AddMemberDto } from './dto/add-member.dto.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { GroupsService } from './groups.service.js';

type AuthenticatedRequest = Request & { user: { sub: string } };

@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() data: CreateGroupDto) {
    return this.groupsService.createGroup(request.user.sub, data);
  }

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.groupsService.listGroups(request.user.sub);
  }

  @Post(':id/members')
  addMember(@Param('id') groupId: string, @Body() data: AddMemberDto) {
    return this.groupsService.addMember(groupId, data);
  }

  @Delete(':id/members/:memberId')
  removeMember(@Param('id') groupId: string, @Param('memberId') memberId: string) {
    return this.groupsService.removeMember(groupId, memberId);
  }
}
