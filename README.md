# Smart Clinic Management System

## Tổng quan

Smart Clinic Management System là một hệ thống quản lý phòng khám điện tử, phục vụ cho việc quản lý bệnh nhân, bác sĩ, lịch hẹn, hồ sơ y tế, đơn thuốc và dữ liệu thống kê.

Dự án sử dụng:
- Backend: ASP.NET Core Web API với .NET 10
- Frontend: Next.js 16 với React 19 và TypeScript
- Cơ sở dữ liệu: SQL Server qua Entity Framework Core

## Mục tiêu

Hệ thống hướng tới việc hỗ trợ:
- Lễ tân quản lý bệnh nhân và lịch khám
- Bác sĩ truy cập hồ sơ y tế và tạo đơn thuốc
- Quản trị viên theo dõi trạng thái phòng khám qua dashboard

## Nội dung README này

1. Giới thiệu
2. Tính năng
3. Kiến trúc và cấu trúc thư mục
4. Công nghệ sử dụng
5. Yêu cầu môi trường
6. Cấu hình môi trường
7. Hướng dẫn cài đặt và chạy
8. API chính
9. Mô hình dữ liệu
10. Bảo mật và nhược điểm hiện tại
11. Hướng phát triển
12. Triển khai
13. Tài liệu liên quan
14. Project Status
15. Demo & Screenshots
16. How to Use
17. Environment Variables
18. Test
19. Known Issues / Limitations
20. Future Improvements
21. Contributing
22. License
23. Phụ lục

---

## 1. Tính năng chính

- Xác thực người dùng bằng JWT
- Đăng ký và đăng nhập
- Quản lý bệnh nhân: tạo, xem, sửa, xóa, phân trang
- Quản lý bác sĩ
- Quản lý lịch hẹn
- Quản lý hồ sơ y tế
- Quản lý đơn thuốc và thuốc
- Dashboard thống kê tổng quan

## 2. Kiến trúc tổng quan

Hệ thống được thiết kế theo kiến trúc phân tầng:

- `ERMSystem.API`: lớp API, controllers, cấu hình middleware
- `ERMSystem.Application`: DTO, interface và logic dịch vụ
- `ERMSystem.Domain`: các entity/domain model
- `ERMSystem.Infrastructure`: EF Core DbContext, repository, data access

Frontend nằm trong thư mục `FontE`, hoạt động độc lập như một SPA React/Next.js.

### Kiến trúc giao tiếp

```
Browser
  └─ Next.js Frontend
        └─ Axios + JWT -> ASP.NET Core API
              └─ Entity Framework Core -> SQL Server
```

## 3. Cấu trúc thư mục

```
smart-clinic-management-system/
  BackE/
    ERMSystem.API/              # Backend API và cấu hình
    ERMSystem.Application/      # DTO, interface, service logic
    ERMSystem.Domain/           # Domain entity models
    ERMSystem.Infrastructure/   # DbContext, repositories, data access
  FontE/
    app/                       # Next.js App Router pages
      (main)/                   # Layout bảo vệ và trang chính
      login/                    # Trang đăng nhập
    components/                # UI components
      layout/                   # Sidebar, Header, ProtectedLayout
      ui/                       # Card, Button, Modal
    hooks/                     # Custom React hooks
    services/                  # API request wrappers
    public/                    # Static assets
    package.json               # Frontend dependencies
    tsconfig.json              # TypeScript config
  README.md                     # Tài liệu dự án
  .gitignore
```

## 4. Công nghệ sử dụng

### Backend

- .NET 10
- ASP.NET Core Web API
- Entity Framework Core 10
- Microsoft.EntityFrameworkCore.SqlServer
- Microsoft.AspNetCore.Authentication.JwtBearer
- BCrypt.Net-Next
- Scalar.AspNetCore (OpenAPI helper)

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Axios
- React Hot Toast

## 5. Yêu cầu môi trường

- .NET SDK 10
- Node.js 20+
- npm
- SQL Server (hoặc SQL Server Express / LocalDB)

## 6. Cấu hình môi trường

### Backend

Sử dụng file `BackE/ERMSystem.API/appsettings.json` để cấu hình.

Ví dụ cấu hình mặc định:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=CaptianSon;Database=ERMSystemDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "ERMSystem_JWT_Secret_Key_2026_32c",
    "Issuer": "ERMSystem",
    "Audience": "ERMSystemUsers",
    "ExpiryMinutes": 60
  }
}
```

### Frontend

Frontend dùng `NEXT_PUBLIC_API_URL` để thiết lập URL backend.

Trong `FontE/next.config.ts`, có cấu hình rewrite:

```ts
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5219/api";
```

Ví dụ khai báo:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5219
```

### Gợi ý cấu hình an toàn

- Không lưu `Jwt:Key` vào source control
- Thay `ConnectionStrings` bằng biến môi trường khi deploy
- Không commit trực tiếp database server credentials

## 7. Hướng dẫn cài đặt và chạy

### 7.1 Backend

Mở terminal tại `BackE/ERMSystem.API`:

```bash
cd BackE/ERMSystem.API
dotnet restore
dotnet build
```

Cài đặt `dotnet-ef` nếu chưa có:

```bash
dotnet tool install --global dotnet-ef --version 10.0.0
```

Cập nhật database:

```bash
dotnet ef database update
```

Chạy backend:

```bash
dotnet run
```

Backend mặc định chạy tại:
- `https://localhost:5219`
- `http://localhost:5219`

### 7.2 Frontend

Mở terminal tại `FontE`:

```bash
cd FontE
npm install
npm run dev
```

Front-end sẽ chạy tại:
- `http://localhost:3000`

### 7.3 Khởi động đồng thời

1. Khởi động backend trước
2. Khởi động frontend sau
3. Mở trình duyệt và đăng nhập tại `http://localhost:3000`

## 8. Danh sách API chính

### Auth

- `POST /api/auth/register`
  - Payload: `{ username, password, role }`
- `POST /api/auth/login`
  - Payload: `{ username, password }`

### Patients

- `GET /api/patients?pageNumber=1&pageSize=10`
- `GET /api/patients/{id}`
- `POST /api/patients`
- `PUT /api/patients/{id}`
- `DELETE /api/patients/{id}`

### Dashboard

- `GET /api/dashboard/stats`

### Các bộ tài nguyên khác

- `Doctors`
- `Appointments`
- `MedicalRecords`
- `Prescriptions`

> Lưu ý: các route CRUD khác hoạt động theo mô hình tương tự.

## 9. Mô hình dữ liệu chính

### Thực thể chính

- `AppUser`: Người dùng hệ thống
- `Patient`: Bệnh nhân
- `Doctor`: Bác sĩ
- `Appointment`: Lịch hẹn
- `MedicalRecord`: Hồ sơ y tế
- `Prescription`: Đơn thuốc
- `PrescriptionItem`: Chi tiết thuốc trong đơn
- `Medicine`: Thuốc

### Quan hệ dữ liệu

```
Patient 1 ──* Appointment *── 1 Doctor
Appointment 1 ── 1 MedicalRecord
MedicalRecord 1 ──* Prescription
Prescription 1 ──* PrescriptionItem *── 1 Medicine
```

### Ghi chú đặc biệt

- `Prescription.MedicalRecordId` đang có unique index, mô tả một `MedicalRecord` chỉ có thể liên kết đến 1 `Prescription`.
- `AppUser` lưu `Username`, `PasswordHash`, `Role`.

## 10. Bảo mật và nhược điểm hiện tại

### Điểm mạnh

- Sử dụng JWT cho xác thực
- Password được hash với BCrypt
- API bảo vệ bằng `[Authorize]`

### Hạn chế

- Token JWT lưu `localStorage` => dễ bị XSS
- Chưa có refresh token
- Chưa phân quyền chi tiết theo role cho từng controller/action
- Cấu hình nhạy cảm hiện tại vẫn nằm trong source

### Khuyến nghị

- Thay `localStorage` bằng cơ chế bảo mật hơn nếu có thể
- Thêm kiểm soát quyền truy cập theo role
- Đặt các giá trị nhạy cảm từ biến môi trường

## 11. Hướng phát triển tiếp theo

- Thêm phân quyền `Admin`, `Doctor`, `Receptionist`
- Hoàn thiện UI/UX và thông báo lỗi chính xác
- Thêm test unit và integration cho backend/frontend
- Thêm tính năng reset mật khẩu thật sự
- Hoàn thiện paging/search server-side cho nhiều endpoint
- Bổ sung log và monitoring khi deploy

## 12. Triển khai

### Mục tiêu sản phẩm

Dự án có thể deploy trên:
- Windows Server / IIS
- Linux / Docker
- Azure App Service

### Bước triển khai cơ bản

1. Build backend: `dotnet publish -c Release`
2. Build frontend: `npm run build`
3. Triển khai backend lên server có .NET Runtime
4. Triển khai frontend lên server hoặc host static
5. Cấu hình `NEXT_PUBLIC_API_URL` trỏ tới backend
6. Áp dụng migration database trên môi trường production

### Lưu ý

- Đảm bảo backend và frontend cùng sử dụng URL API chính xác
- Áp dụng HTTPS
- Sử dụng biến môi trường để cấu hình secrets

## 13. Các file quan trọng

- `BackE/ERMSystem.API/Program.cs` — cấu hình startup, DI, authentication, CORS
- `BackE/ERMSystem.API/appsettings.json` — cấu hình kết nối và JWT
- `BackE/ERMSystem.Infrastructure/Data/ApplicationDbContext.cs` — định nghĩa DbSet và quan hệ entity
- `BackE/ERMSystem.Application/Services/*` — logic nghiệp vụ
- `FontE/app/(main)` — layout và các trang chính
- `FontE/hooks/useAuth.ts` — xử lý xác thực frontend
- `FontE/services/api.ts` — cấu hình Axios và interceptor

## 14. Gợi ý triển khai đồ án tốt nghiệp

Nếu bạn dùng dự án này làm đồ án, nên bổ sung thêm:
- Báo cáo nội dung chức năng
- Sơ đồ kiến trúc hệ thống
- Sơ đồ ERD
- Giới thiệu các API chính
- Ghi chú bảo mật và kiến trúc
- Hướng dẫn chạy và demo

---

## 15. Sơ đồ ERD chi tiết

### 15.1. Mô tả sơ đồ ERD

ERD (Entity Relationship Diagram) mô tả các thực thể dữ liệu chính và quan hệ giữa chúng.

- `AppUser`
  - `Id`, `Username`, `PasswordHash`, `Role`
  - Quản lý người dùng hệ thống
- `Patient`
  - `Id`, `FullName`, `DateOfBirth`, `Gender`, `Phone`, `Address`, `CreatedAt`
  - Thông tin bệnh nhân
- `Doctor`
  - `Id`, `FullName`, `Specialty`
  - Thông tin bác sĩ
- `Appointment`
  - `Id`, `PatientId`, `DoctorId`, `AppointmentDate`, `Status`
  - Kết nối bệnh nhân và bác sĩ
- `MedicalRecord`
  - `Id`, `AppointmentId`, `Symptoms`, `Diagnosis`, `Notes`
  - Hồ sơ y tế của một lịch hẹn
- `Prescription`
  - `Id`, `MedicalRecordId`, `CreatedAt`
  - Đơn thuốc liên quan tới hồ sơ y tế
- `PrescriptionItem`
  - `Id`, `PrescriptionId`, `MedicineId`, `Dosage`, `Duration`
  - Chi tiết từng thuốc trong đơn
- `Medicine`
  - `Id`, `Name`, `Description`
  - Danh sách thuốc sẵn có

### 15.2. ERD text format

```
AppUser
  - Id (PK)
  - Username
  - PasswordHash
  - Role

Patient
  - Id (PK)
  - FullName
  - DateOfBirth
  - Gender
  - Phone
  - Address
  - CreatedAt

Doctor
  - Id (PK)
  - FullName
  - Specialty

Appointment
  - Id (PK)
  - PatientId (FK -> Patient.Id)
  - DoctorId (FK -> Doctor.Id)
  - AppointmentDate
  - Status

MedicalRecord
  - Id (PK)
  - AppointmentId (FK -> Appointment.Id)
  - Symptoms
  - Diagnosis
  - Notes

Prescription
  - Id (PK)
  - MedicalRecordId (FK -> MedicalRecord.Id)
  - CreatedAt

PrescriptionItem
  - Id (PK)
  - PrescriptionId (FK -> Prescription.Id)
  - MedicineId (FK -> Medicine.Id)
  - Dosage
  - Duration

Medicine
  - Id (PK)
  - Name
  - Description
```

### 15.3. Quan hệ chi tiết

- `Patient 1..* Appointment`
- `Doctor 1..* Appointment`
- `Appointment 1..1 MedicalRecord`
- `MedicalRecord 1..* Prescription`
- `Prescription 1..* PrescriptionItem`
- `Medicine 1..* PrescriptionItem`

### 15.4. Lưu ý ERD

- `Prescription.MedicalRecordId` được thiết kế với unique index, do đó mỗi hồ sơ y tế sẽ chỉ có một đơn thuốc.
- Mối quan hệ `MedicalRecord -> Prescription` mặc dù khai báo là collection, nhưng cơ chế unique index thực chất giới hạn 1 prescription trên mỗi medical record.

## 16. Báo cáo đồ án

### 16.1. Mục tiêu đồ án

- Xây dựng hệ thống quản lý phòng khám điện tử
- Hỗ trợ toàn bộ quy trình quản lý bệnh nhân, lịch hẹn, hồ sơ và đơn thuốc
- Cung cấp dashboard thống kê giúp theo dõi hoạt động phòng khám

### 16.2. Yêu cầu chức năng

- Quản lý người dùng và xác thực
- Quản lý bệnh nhân
- Quản lý bác sĩ
- Quản lý lịch hẹn
- Quản lý hồ sơ y tế
- Quản lý đơn thuốc và thuốc
- Báo cáo tổng quan qua dashboard

### 16.3. Giải pháp kỹ thuật

- Backend: ASP.NET Core Web API dựa trên .NET 10.
- Data access: Entity Framework Core với SQL Server.
- Xác thực: JWT Bearer.
- Mã hóa mật khẩu: BCrypt.
- Frontend: Next.js App Router, React 19, TypeScript và Tailwind CSS.

### 16.4. Thiết kế kiến trúc

- Tách biệt backend và frontend.
- Backend theo mô hình phân tầng: Controller → Service → Repository → Domain.
- Frontend theo mô hình component và pages, dùng hooks và services để gọi API.
- Sử dụng JWT để bảo vệ đường dẫn và xác thực người dùng.

### 16.5. Các công nghệ chủ yếu

- .NET 10, ASP.NET Core, Entity Framework Core
- SQL Server
- Next.js 16, React 19, TypeScript
- Tailwind CSS
- Axios

### 16.6. Quá trình triển khai

1. Xây dựng và cấu hình backend.
2. Khởi tạo database bằng EF Core migration.
3. Xây dựng frontend và kết nối với API.
4. Thử nghiệm đăng nhập, CRUD bệnh nhân, dashboard.
5. Hoàn thiện layout và bảo mật cơ bản.

### 16.7. Các khó khăn và cách khắc phục

- Quản lý quan hệ dữ liệu giữa Appointment, MedicalRecord và Prescription: thiết kế ERD và entity mapping trong EF Core.
- Xác thực JWT và cấu hình CORS: đảm bảo frontend và backend hoạt động cùng domain localhost.
- Giao diện UI/UX: sử dụng Tailwind CSS để tạo layout đơn giản, dễ mở rộng.

### 16.8. Kiểm thử

- Kiểm thử chức năng đăng nhập/đăng ký.
- Kiểm thử CRUD bệnh nhân.
- Kiểm thử hiển thị dashboard.
- Kiểm thử bảo vệ route trong frontend bằng `ProtectedLayout`.

### 16.9. Đánh giá kết quả

- Dự án đã hiện thực được chức năng quản lý bệnh nhân, lịch hẹn, hồ sơ y tế, đơn thuốc và dashboard.
- Cấu trúc dự án rõ ràng và phù hợp cho đồ án tốt nghiệp.
- Cần bổ sung tài liệu, phân quyền chi tiết, và test tự động để hoàn thiện hơn.

### 16.10. Kết luận

Dự án đã đạt được mục tiêu xây dựng một hệ thống quản lý phòng khám cơ bản. Với một số cải tiến về bảo mật, phân quyền và tài liệu, dự án đủ điều kiện làm đồ án tốt nghiệp ở mức khá tốt.

---

## 17. Project Status

- Phiên bản hiện tại: `v1.0.0`
- Trạng thái: Beta / Hoàn thiện chức năng cơ bản
- Tình trạng: Tích hợp backend và frontend, có authentication, CRUD chính, dashboard.
- Chưa hoàn thiện: phân quyền chi tiết, tests tự động, cơ chế reset password, deployment production.

## 18. Demo & Screenshots

### Demo
- Bạn có thể chạy nhanh bằng cách khởi động backend và frontend theo hướng dẫn trong phần 7.
- Truy cập `http://localhost:3000` để vào trang đăng nhập.

### Ảnh minh họa
- Nên thêm ảnh chụp màn hình của các trang sau vào README nếu có:
  - Trang đăng nhập
  - Trang dashboard
  - Trang danh sách bệnh nhân
  - Form tạo / cập nhật bệnh nhân
  - Trang hồ sơ y tế / đơn thuốc

Ví dụ:

```md
![Login screen](./docs/screenshots/login.png)
![Dashboard](./docs/screenshots/dashboard.png)
```

## 19. How to Use

### Bước 1: Tạo tài khoản
- Truy cập `/login` và sử dụng API `POST /api/auth/register` để đăng ký tài khoản.
- Hiện tại không có UI đăng ký trực tiếp nên bạn có thể sử dụng Postman hoặc một form tạm.

### Bước 2: Đăng nhập
- Sử dụng tài khoản đã đăng ký để gọi `POST /api/auth/login`.
- Sau khi nhận token, frontend sẽ tự động lưu token và chuyển tới dashboard.

### Bước 3: Khám phá chức năng
- Dashboard: hiển thị tổng số bệnh nhân, lịch hẹn hôm nay, số lịch hẹn hoàn thành.
- Patients: quản lý bệnh nhân, tìm kiếm cơ bản và phân trang.
- Appointments: xem lịch hẹn, cập nhật trạng thái.
- MedicalRecords: xem hồ sơ y tế, liên kết hồ sơ với lịch hẹn.
- Prescriptions: quản lý đơn thuốc và chi tiết thuốc.

## 20. Environment Variables

### Backend

Tạo file `appsettings.Development.json` hoặc sử dụng biến môi trường:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=ERMSystemDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "YOUR_SECRET_KEY",
    "Issuer": "ERMSystem",
    "Audience": "ERMSystemUsers",
    "ExpiryMinutes": 60
  }
}
```

Hoặc dùng biến môi trường:

```bash
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__DefaultConnection="Server=YOUR_SERVER;Database=ERMSystemDb;Trusted_Connection=True;..."
Jwt__Key="YOUR_SECRET_KEY"
Jwt__Issuer="ERMSystem"
Jwt__Audience="ERMSystemUsers"
Jwt__ExpiryMinutes=60
```

### Frontend

Tạo file `FontE/.env.local` với nội dung:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5219
```

### Ví dụ `.env.example`

Tạo file `FontE/.env.example` với:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5219
```

Và tạo file `BackE/.env.example` với:

```bash
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__DefaultConnection="Server=YOUR_SERVER;Database=ERMSystemDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
Jwt__Key="YOUR_SECRET_KEY"
Jwt__Issuer="ERMSystem"
Jwt__Audience="ERMSystemUsers"
Jwt__ExpiryMinutes=60
```

## 21. Test

Hiện tại dự án chưa triển khai test tự động.

### Đề xuất test
- `dotnet test` cho backend nếu thêm project test.
- `npm test` hoặc `npm run lint` cho frontend khi bổ sung test.

## 22. Known Issues / Limitations

- API `search` trên frontend hiện chưa được backend hỗ trợ đầy đủ.
- Header logout ở sidebar chưa chạy được.
- Phân quyền theo vai trò chưa được enforce chi tiết trên backend.
- Token JWT được lưu `localStorage`, dễ bị XSS.
- Chưa có refresh token.
- Chưa có trang đăng ký người dùng trực tiếp trên frontend.

## 23. Future Improvements

- Thêm phân quyền chi tiết `Admin`, `Doctor`, `Receptionist`.
- Thêm page quản lý người dùng (user management).
- Thêm tính năng reset mật khẩu và quên mật khẩu.
- Thêm hệ thống logging và audit trail.
- Thêm validation phía server chặt chẽ hơn.
- Thêm API search/filter thực sự và pagination general.
- Thêm test tự động cho backend/frontend.
- Hỗ trợ deploy bằng Docker.

## 24. Contributing

Nếu bạn muốn phát triển tiếp dự án này:

1. Fork repository.
2. Tạo branch tính năng mới.
3. Ghi rõ mục tiêu và thay đổi trong commit message.
4. Gửi pull request khi hoàn thành.

Chuẩn code:
- Backend: tuân thủ chuẩn C# và naming convention.
- Frontend: tuân thủ TypeScript và quy tắc ESLint/Prettier.

## 25. License

No license.

---

## 26. Phụ lục

### 26.1. Sơ đồ phụ thuộc chính

- Frontend `FontE` gọi API qua `FontE/services/api.ts`.
- Backend `ERMSystem.API` dùng `ERMSystem.Application` và `ERMSystem.Infrastructure`.
- Data access được thực hiện trong `ERMSystem.Infrastructure/Data/ApplicationDbContext.cs`.

### 26.2. Đề xuất cải tiến thêm

- Thêm mô-đun quản lý người dùng và quyền truy cập.
- Thêm chức năng export báo cáo.
- Thêm trang quản lý thuốc chi tiết.
- Thêm validation phía backend chặt chẽ hơn.
- Triển khai CI/CD và test tự động.
