# Cursed Walking LIVE

Bản đóng gói ngày 03/11/2026 để lưu trên GitHub. Giữ bố cục `outputs/` và `work/` của bộ dữ liệu gốc. Bản lưu dự án được chuẩn bị để chia sẻ qua GitHub.

## Thành phần

- Kho mã nguồn này chứa mã, cấu hình mẫu, tài liệu và tài sản nhỏ.
- Dữ liệu lớn nằm ở Releases: 2 phần `cursed-walking-live-ready-data.zip.partNNN`. Tải đầy đủ các phần và `release-assets.json` về cùng một thư mục.
- `package-manifest.json`: đường dẫn, kích thước và SHA-256 của mọi tệp được đóng gói.
- `PACKAGING-REPORT.json`: danh sách cache/log/tệp tạm bị bỏ qua và tệp được thay thông tin nhạy cảm bằng mẫu.
- Mọi giấy phép/ghi công có sẵn tiếp tục áp dụng; không gán giấy phép mới cho các thành phần bên thứ ba.

## Khôi phục

Nên giải nén kho mã nguồn vào đường dẫn ngắn, ví dụ `C:\Projects\cursed-walking-live-ready`, để tránh giới hạn đường dẫn của một số công cụ Windows.

Mở PowerShell tại thư mục kho mã nguồn, chạy:

```powershell
.\Restore-Data.ps1 -AssetsDirectory 'D:\Downloads\cursed-walking-live-ready-release'
.\Configure-Local.ps1
```

Công cụ kiểm tra SHA-256, ghép gói, kiểm tra đường dẫn giải nén và đối chiếu SHA-256 từng tệp được khôi phục. Cần chỗ trống cho gói ZIP tạm và dữ liệu giải nén. Công cụ cấu hình tạo mật khẩu mới; không khởi chạy game, máy chủ hoặc bộ cài.

## Chạy dự án

Đọc hướng dẫn gốc trong từng thư mục `outputs/`. Sau khi khôi phục, mở đúng dự án hoặc script khởi chạy của nó. Những script lịch sử trong `work/` có thể còn đường dẫn của máy phát triển; không tự động chạy toàn bộ thư mục này.

Máy chủ Forge 1.20.1 cần Java 17; bộ công cụ Node cần Node.js phù hợp. Configure-Local.ps1 tìm java/node trong PATH hoặc bản cài Windows và điền cấu hình máy mới. Nếu chưa cài Java/Node, hãy cài rồi chạy lại cấu hình.

## Đăng lên GitHub

Tạo một repository trống, sau đó đưa NỘI DUNG thư mục này lên repository. Có thể dùng GitHub Desktop hoặc Git. Không đưa thư mục release-assets vào commit.

Tạo Release riêng và đính kèm toàn bộ tệp trong thư mục release-assets tương ứng, gồm file JSON và bộ cài riêng nếu có. Các phần ZIP không mở riêng lẻ; dùng Restore-Data.ps1 để khôi phục.

Các mật khẩu gốc đã được thay trong bản đóng gói. Cấu hình `*.local.json` và `server.properties` tạo lại được Git bỏ qua. Đây là bản đóng gói được kiểm tra tính toàn vẹn, chưa được chạy thử trên máy sạch.

Các ZIP cũ được làm sạch mật khẩu có SHA-256 khác gói upstream. Dùng `package-manifest.json` để kiểm tra bản đóng gói này; thông tin SHA nguồn trong các tệp source-and-versions gốc chỉ nhận diện bản upstream trước khi làm sạch.
