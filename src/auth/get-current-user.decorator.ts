import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../users/users.entity';
import { Request } from 'express';

export const GetCurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<Request & { user: User }>();
    return request.user;
  },
);
