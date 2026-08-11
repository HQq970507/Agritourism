import { HttpException, HttpStatus } from '@nestjs/common';

class NoProductException extends HttpException {
  constructor() {
    super('未找到产品', HttpStatus.BAD_REQUEST);
  }
}

class NoProductStockException extends HttpException {
  constructor() {
    super('产品库存不足', HttpStatus.BAD_REQUEST);
  }
}

class BadGetUserOrderDetailException extends HttpException {
  constructor() {
    super('获取用户订单详情失败', HttpStatus.BAD_REQUEST);
  }
}

class BadCreateOrderException extends HttpException {
  constructor() {
    super('创建订单失败', HttpStatus.BAD_REQUEST);
  }
}

export {
  NoProductException,
  NoProductStockException,
  BadGetUserOrderDetailException,
  BadCreateOrderException,
};
