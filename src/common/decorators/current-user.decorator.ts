import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (property: string | undefined, context: ExecutionContext): unknown => {
    const request = context
      .switchToHttp()
      .getRequest<{ user: Record<string, string> }>();
    return property ? request.user[property] : request.user;
  },
);
