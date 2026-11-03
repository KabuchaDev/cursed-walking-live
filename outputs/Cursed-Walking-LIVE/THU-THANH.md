# THÀNH TRÌ 07 — Cursed Walking Tower Defense

Map thành phố hậu tận thế 225 × 193 block, đường zombie dài 588 block, trong server **127.0.0.1:25567**.

## Vào chơi

1. Mở **BAT-THU-THANH.cmd**, đợi server sẵn sàng, vào Minecraft → Multiplayer → `127.0.0.1:25567`.
2. Dùng `/cw_td join` để vào sân. Túi đồ sinh tồn được lưu riêng và khôi phục bằng `/cw_td leave`.
3. Bấm **BẮT ĐẦU / CHƠI LẠI** tại căn cứ hoặc dùng `/cw_td start`. `/cw_td` mở menu; `/cw_td pause` tạm dừng/tiếp tục.
4. Kết nối LIVE trong TikFinity. Streamer.bot và bộ kết nối phải đang chạy.

## Súng luân phiên

- Bình thường: súng tự động T1, **5 băng tổng cộng** mỗi khẩu. Pool hiện tại: VG 1-5 và SMG 08/18, lấy từ hạng nhiệm vụ trong modpack.
- Rosa: T2 trong **3 phút**, **10 băng** mỗi khẩu; 18 khẩu tự động trong danh sách T2 của modpack.
- Perfume: T3 trong **3 phút**, **10 băng** mỗi khẩu; 9 khẩu tự động trong danh sách T3 của modpack.
- Súng tự đổi khi hết cả đạn đã nạp và đạn dự trữ. Bấm **R** nạp như bình thường. Đạn dự trữ được giữ trong cơ chế dự trữ của TaCZ, không chiếm ô túi đồ. Tổng 5/10 băng đã bao gồm băng nạp sẵn.
- Lệnh dự phòng `/cw_gun_next` hoặc nút đổi súng trong menu chỉ hoạt động sau khi hết toàn bộ đạn.
- Nhận thêm cùng loại quà cộng 3 phút. T3 ưu tiên hơn T2; nhận Rosa khi T3 đang chạy sẽ cộng thời gian T2 để dùng sau. Thời gian T2 còn lại cũng được giữ khi T3 chen vào.
- Tạm dừng, thua lượt hoặc không có người trong sân sẽ dừng đồng hồ. Thời gian còn lại được lưu qua lần mở lại server.

## Trụ súng

Có **6 bệ gắn súng** màu cam nối với các điểm bắn, gần đường zombie.

Cầm súng, đứng gần bệ có biển **TRỤ**, chờ dòng **“Bấm E để súng tự động bắn”**, rồi bấm **E**. Khẩu súng trên tay được treo lên trụ; bạn nhận khẩu tiếp theo của hạng đang dùng. E vẫn mở túi đồ khi không đứng gần bệ phù hợp. Có thể dùng `/cw_turret` hoặc nút gắn súng trong menu thay E.

Trụ hoạt động **5 phút trong lượt đang chạy**, chỉ bắn zombie thủ thành cách tối đa **10 block**, ưu tiên con đã tiến xa hơn trên đường. Tốc độ và sát thương lấy từ cấu hình khẩu súng đã gắn. Trụ dùng đạn tự động trong thời gian hiệu lực, không rút thêm đạn trong túi người chơi. Hết thời gian, súng trên trụ biến mất. Thua hoặc bắt đầu lượt mới sẽ dọn các trụ.

## TikTok — quy tắc hiện tại

| Sự kiện | Hiệu ứng |
|---|---|
| Mỗi 1 tim | 1 Weak Zombie |
| Rose — 1 xu | 5 zombie |
| Okay — 5 xu | 20 zombie |
| Rosa — 10 xu | T2 +3 phút |
| Shamrock — 10 xu | 50 zombie |
| Little Kisses — 20 xu | 3 Mutant Zombie |
| Perfume — 20 xu | T3 +3 phút |
| Doughnut / Doughhut — 30 xu | 5 Mutant Zombie |

Rose, Okay và Shamrock: mỗi con chọn **80% nhóm yếu, 20% nhóm trung bình**, không chọn nhóm mạnh. Quà combo nhân hiệu ứng theo số quà; sự kiện trùng không được đếm lại. **Follow, You're awesome, Finger Heart và Spinning Soccer đã tắt.**

Zombie xuất hiện tại cổng đầu đường, không đuổi hoặc gây sát thương trực tiếp cho bạn. Mutant đi khoảng **0,7 block/giây**, chậm hơn zombie yếu khoảng **1,5 block/giây** khi server đạt 20 TPS. Đầu/thân xoay theo đường.

Nhà chính có **1.000 HP**. Mỗi zombie tới đích gây sát thương một lần rồi biến mất. Khi HP về 0, lượt thua, zombie còn trên sân được dọn. Bấm chơi lại để bắt đầu lượt mới. Tim và quà chưa được thực hiện vẫn ở hàng chờ; quà tăng hạng súng được ưu tiên trước hàng zombie.

## Chạy và hiệu năng

- Tốc độ người chơi trong sân tăng **60%**, tự trả về bình thường khi rời sân. Thanh đói luôn đầy.
- Sân ở chiều không gian riêng. Tắt việc giữ vùng xuất phát thế giới sinh tồn luôn hoạt động; thế giới cũ vẫn được lưu.
- Chỉ giữ 56 vùng cần thiết cho tuyến zombie và trụ hoạt động, thay cho 195 vùng trước. Tầm nhìn server 6, phạm vi mô phỏng người chơi 4.
- Giới hạn **120 zombie trên sân**; zombie còn lại chờ đến khi có chỗ. 1 tim vẫn ghi nhận 1 zombie, không âm thầm bỏ tim khi đông người xem.

## Sao lưu và kiểm tra

Túi đồ sinh tồn: `server/kubejs/cw-td-players.json`; không xóa file này. Sao lưu trước cập nhật: `backups/before-arsenal-turrets-20261012-145546`. Bản đồ gốc: `backups/before-tower-defense-20261011-214735`.

Đã thử trực tiếp API game: tự đổi súng, tổng số đạn, T2 chờ sau T3, hết hạn về T1, chống cấp quà trùng, gắn trụ, trụ gây sát thương trong tầm/không bắn ngoài tầm, tạm dừng và hết hạn trụ, tăng/khôi phục tốc độ. Kết quả: `arsenal-verification.json`.

Luồng mô phỏng mới đã xử lý 433 zombie và 2 lần tăng hạng qua 47 đợt, giữ hàng chờ qua khởi động lại và bỏ sự kiện trùng. Quà TikTok trả xu thật chưa được thử vì chưa có xu. Dogalive67 đã xác nhận E treo súng và nhận khẩu tiếp theo; server ghi nhận trụ bắn 481 phát trong lượt thật. Đã cấp thử T3 rồi T2 qua Streamer.bot thành công và quay về T1 sau khi hết hiệu lực. Kết quả: arsenal-player-verification.json.

