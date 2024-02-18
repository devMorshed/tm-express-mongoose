class ApiResponse {
  statusCode: number;
  data?: any;
  message: any;
  success: boolean;

  constructor(
    statusCode: number,
    message = "Success",
    success = true,
    data?: null | any
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.success = success;
    this.data = data;
  }
}

export default ApiResponse;
