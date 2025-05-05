class ApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: any;
  constructor(statusCode: number, message: string, data: any) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export default ApiResponse;
