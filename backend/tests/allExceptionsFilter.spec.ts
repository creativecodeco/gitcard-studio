import { describe, it, expect, vi } from 'vitest';
import { AllExceptionsFilter } from '@/infrastructure/filters/all-exceptions.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  it('should catch HttpExceptions and send formatted status and message', () => {
    const filter = new AllExceptionsFilter();

    const mockResponse = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };

    const mockRequest = {
      method: 'GET',
      url: '/api/stats'
    };

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest
      })
    } as unknown as ArgumentsHost;

    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.send).toHaveBeenCalledWith('Bad Request');
  });

  it('should catch unexpected errors and return 500 Internal Server Error', () => {
    const filter = new AllExceptionsFilter();

    const mockResponse = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };

    const mockRequest = {
      method: 'GET',
      url: '/api/metrics'
    };

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest
      })
    } as unknown as ArgumentsHost;

    const exception = new Error('Unexpected DB Error');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.send).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error'
    });
  });
});
