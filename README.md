# Cursed Walking LIVE

A personal Cursed Walking v3.3 server archive with livestream rewards, tower-defense controls and supporting source tools.

**[Download data & runtime](https://github.com/KabuchaDev/cursed-walking-live/releases/latest)** · **[Restoration guide](docs/PACKAGE-RESTORE.md)** · **[Original guide](outputs/Cursed-Walking-LIVE/HUONG-DAN.md)**

## Tổng quan

Minecraft Java 1.20.1, Forge 47.4.0. Giữ máy chủ, modpack, thế giới trò chơi, bản sao lưu, bridge livestream và các công cụ chuẩn bị/kiểm tra. Đây là bản lưu cấu hình máy chủ cá nhân, không phải cấu hình triển khai Internet đã được kiểm thử. Mật khẩu RCON và token điều khiển gốc được thay bằng mẫu.

## Nội dung dự án

| Thành phần | Vị trí |
|---|---|
| Server, bridge and controls | [outputs/Cursed-Walking-LIVE](outputs/Cursed-Walking-LIVE) |
| Project guide | [outputs/Cursed-Walking-LIVE/HUONG-DAN.md](outputs/Cursed-Walking-LIVE/HUONG-DAN.md) |
| Tower-defense guide | [outputs/Cursed-Walking-LIVE/THU-THANH.md](outputs/Cursed-Walking-LIVE/THU-THANH.md) |
| Interaction mappings | [outputs/Cursed-Walking-LIVE/BANG-TUONG-TAC.md](outputs/Cursed-Walking-LIVE/BANG-TUONG-TAC.md) |
| Preparation and verification tools | [work](work) |

## Tải về và khôi phục

1. Clone repository hoặc tải mã nguồn bằng nút **Code → Download ZIP**. Nên dùng đường dẫn ngắn như `C:\Projects\cursed-walking-live`.
2. Mở **[Releases](https://github.com/KabuchaDev/cursed-walking-live/releases/latest)** và tải đủ các phần `*-data.zip.partNNN` vào cùng một thư mục. Các phần không giải nén riêng lẻ.
3. Mở PowerShell tại thư mục mã nguồn và chạy:

```powershell
.\Restore-Data.ps1 -AssetsDirectory 'D:\Downloads\cursed-walking-live-release'
.\Configure-Local.ps1
```

4. Đọc hướng dẫn gốc của từng ứng dụng trước khi khởi chạy. Công cụ khôi phục và cấu hình không tự chạy game, server hoặc bộ cài.

## Mã nguồn và tệp lớn

- Mã, cấu hình mẫu, tài liệu và tài sản nhỏ nằm trong repository.
- Mô hình, runtime, mod/server pack, thế giới và bản sao lưu lớn nằm trong **Releases**; `Restore-Data.ps1` đưa chúng về đúng vị trí.
- `package-manifest.json` ghi SHA-256 của từng tệp đóng gói; `SHA256SUMS.txt` trên Release kiểm tra các tệp tải về.
- Các mật khẩu/khóa cấu hình gốc đã chuyển thành mẫu; `Configure-Local.ps1` tạo cấu hình và khóa mới trên máy sử dụng. Không commit các cấu hình riêng vừa tạo.
- Cache, log và tệp tạm được bỏ qua có ghi trong `PACKAGING-REPORT.json`.

## Ghi công và phạm vi kiểm tra

Các thành phần bên thứ ba giữ giấy phép và tác giả gốc. Repository này không thay thế giấy phép Minecraft, modpack, Unity, mô hình AI hoặc phần mềm bên thứ ba. Xem các tệp LICENSE/THIRD-PARTY có sẵn trong từng thư mục.

Bản lưu ngày **03/11/2026** đã qua kiểm tra SHA-256/ZIP và thử công cụ khôi phục/cấu hình. Chưa chạy thử toàn bộ trên một máy sạch. Một số script lịch sử trong `work/` còn tham chiếu đường dẫn máy phát triển; chúng được giữ để tham khảo.
