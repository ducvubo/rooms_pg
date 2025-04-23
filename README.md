# Rooms Management System

## Giới thiệu
Đây là một hệ thống quản lý phòng được xây dựng bằng NestJS - một framework Node.js mạnh mẽ và có cấu trúc tốt. Project này cung cấp các API để quản lý thông tin phòng, đặt phòng và các chức năng liên quan.

## Công nghệ sử dụng
- **Backend Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT
- **Container**: Docker
- **CI/CD**: GitLab CI

## Yêu cầu hệ thống
- Node.js (v14 trở lên)
- PostgreSQL
- Docker (tùy chọn)

## Cài đặt

### Cài đặt dependencies
```bash
npm install
```

### Cấu hình môi trường
Tạo file `.env` dựa trên mẫu `.env.example` và cập nhật các biến môi trường cần thiết:
```bash
cp .env.example .env
```

### Chạy ứng dụng
```bash
# Development
npm run start

# Watch mode
npm run start:dev

# Production mode
npm run start:prod
```

### Chạy với Docker
```bash
# Build image
docker build -t rooms-management .

# Run container
docker run -p 3000:3000 rooms-management
```

## Cấu trúc project
```
src/
├── config/         # Cấu hình ứng dụng
├── modules/        # Các module chính
│   ├── auth/      # Xác thực và phân quyền
│   ├── rooms/     # Quản lý phòng
│   └── users/     # Quản lý người dùng
├── common/        # Các utility và shared code
└── main.ts        # Entry point
```

## API Documentation
API documentation có thể được truy cập tại `/api` sau khi chạy ứng dụng.

## Testing
```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## CI/CD
Project sử dụng GitLab CI để tự động hóa quá trình build, test và deploy. Cấu hình CI/CD được định nghĩa trong file `.gitlab-ci.yml`.

## Contributing
1. Fork project
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## License
[MIT License](LICENSE)
