import { HttpException, HttpStatus } from '@nestjs/common';

class BadGetOrderException extends HttpException {
  constructor() {
    super('获取订单信息失败', HttpStatus.BAD_REQUEST);
  }
}

export { BadGetOrderException };
