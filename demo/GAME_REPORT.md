# 📖 TÀI LIỆU BÁO CÁO CƠ CHẾ VÀ VẬN HÀNH GAME

## Match-3 Boss Battle RPG — Game Mechanics & Architecture Report

Tài liệu này cung cấp cái nhìn chi tiết và chuyên nghiệp về toàn bộ kiến trúc, luồng hoạt động (Control Flow), hệ thống tương khắc hệ nguyên tố (Pokémon-style Type System), cơ chế tự động cân bằng độ khó động (DDA Miss System), và các hiệu ứng trạng thái (Buffs/Debuffs) của trò chơi.

---

## 📑 MỤC LỤC

1. [Luồng Hoạt Động Trận Đấu (Battle Control Flow)](#1-luồng-hoạt-động-trận-đấu-battle-control-flow)
2. [Chi Tiết 10 Hệ Ngọc & Tương Khắc Nguyên Tố (Pokémon-style Counters)](#2-chi-tiết-10-hệ-ngọc--tương-khắc-nguyên-tố-pokémon-style-counters)
3. [Cơ Chế Khóa Lượt Ngọc Trượt (Player Swap Miss)](#3-cơ-chế-khóa-lượt-ngọc-trượt-player-swap-miss)
4. [Cơ Chế Cứu Nguy Tự Động (Dynamic Difficulty Adjustment - DDA Miss)](#4-cơ-chế-cứu-nguy-tự-động-dynamic-difficulty-adjustment---dda-miss)
5. [Hệ Thống Hiệu Ứng Trạng Thái (Buffs & Debuffs Matrix)](#5-hệ-thống-hiệu-ứng-trạng-thái-buffs--debuffs-matrix)

---

## 1. LUỒNG HOẠT ĐỘNG TRẬN ĐẤU (BATTLE CONTROL FLOW)

Vòng đời của một trận chiến diễn ra theo một chu trình tuần tự được điều khiển chặt chẽ bởi `BattleScene.js`:

- **Khởi tạo trận đấu**: Đổ bộ các bên tham gia -> Đổ ngọc lên bàn cờ -> Chạy hoạt ảnh Coin Flip phân chia lượt đi thứ nhất.
- **Lượt chơi của Người chơi**:
  - Di ngọc hoặc Kích hoạt kỹ năng chủ động (Click Boss để gây sát thương thẳng).
  - Nếu di ngọc trượt (không combo), ngọc trượt về chỗ cũ và **bị mất lượt ngay lập tức**.
  - Nếu di ngọc trúng, chạy cascade nổ ngọc liên hoàn. Bảng ngọc dừng ổn định hoàn toàn -> Hiển thị bảng tổng hợp **MatchSummaryPanel** -> Bắn projectiles gây dame nguyên tố -> Áp dụng hiệu ứng trạng thái tương ứng.
- **Lượt chơi của Boss**:
  - Kiểm tra trạng thái khống chế (Freeze / Stun). Nếu có, Boss mất lượt.
  - Sử dụng kỹ năng Boss theo chu kỳ.
  - AI quyết định di chuyển ngọc:
    - Nếu máu người chơi `<= 30%` và Boss còn lượt cứu giúp: **Forced DDA Miss** (Boss tự bấm hụt ngọc).
    - Ngược lại: BossAI tìm nước đi tối ưu nhất để kết liễu người chơi.

---

## 2. CHI TIẾT 10 HỆ NGỌC & TƯƠNG KHẮC NGUYÊN TỐ (POKÉMON-STYLE COUNTERS)

Trò chơi sở hữu hệ thống tương khắc nguyên tố chuyên sâu. Mỗi hệ ngọc có lượng sát thương cơ bản và hiệu ứng đặc biệt khác nhau khi được kích hoạt:

### 📊 Bảng Chỉ Số Ngọc Nguyên Bản

| Ngọc Hệ                | Icon | Dmg Gốc | Hiệu Ứng Đặc Biệt Khi Kích Hoạt                     |
| :--------------------- | :--: | :-----: | :-------------------------------------------------- |
| **Fire (Hỏa)**         |  🔥  |   12    | Thiêu đốt mục tiêu (3 dmg / 2 lượt)                 |
| **Water (Thủy)**       |  💧  |   10    | Thanh tẩy toàn bộ hiệu ứng bất lợi trên bản thân    |
| **Nature (Mộc)**       |  🌿  |    6    | Hồi máu lập tức (+8 HP)                             |
| **Ice (Băng)**         |  ❄️  |    8    | Tặng +8 Giáp bản thân & 15% Đóng băng Boss (1 lượt) |
| **Lightning (Lôi)**    |  ⚡  |   15    | Tê liệt Boss (10% cơ hội, bỏ qua lượt kế tiếp)      |
| **Earth (Thổ)**        |  ⛰️  |    5    | Tặng lượng Giáp cực dày (+12 Giáp)                  |
| **Wind (Phong)**       |  💨  |   11    | Xuyên phá 50% Giáp hiện tại của Boss                |
| **Psychic (Tâm linh)** |  👁️  |    9    | Nguyền rủa Boss (-30% sát thương của Boss / 2 lượt) |
| **Sun (Quang)**        |  ☀️  |    7    | Hồi máu lượng lớn (+12 HP)                          |
| **Poison (Độc)**       |  ☠️  |    8    | Nhiễm độc Boss (4 dmg / 3 lượt, có thể cộng dồn)    |

### ⚔️ Ma Trận Tương Khắc Nguyên Tố (Pokémon-style Type Chart)

Mỗi Boss thuộc các Cấp độ sẽ sở hữu một hệ nguyên tố đại diện nhất định. Sát thương nổ ngọc của người chơi sẽ nhân hệ số tương khắc chéo:

- **Gây 2.0x Sát thương (Siêu hiệu quả - Green Glow)**: Nếu ngọc khắc chế Boss.
- **Gây 0.5x Sát thương (Bị kháng - Red Glow)**: Nếu ngọc bị hệ Boss cản trở.

| Attacker (Hệ Ngọc) | 🟢 Gây 2.0x Sát thương lên Boss Hệ | 🔴 Gây 0.5x Sát thương lên Boss Hệ |
| :----------------- | :--------------------------------- | :--------------------------------- |
| **Fire** 🔥        | Nature 🌿, Ice ❄️                  | Water 💧, Earth ⛰️                 |
| **Water** 💧       | Fire 🔥, Earth ⛰️                  | Nature 🌿, Lightning ⚡            |
| **Nature** 🌿      | Water 💧, Earth ⛰️, Poison ☠️      | Fire 🔥, Wind 💨                   |
| **Ice** ❄️         | Nature 🌿, Wind 💨                 | Fire 🔥, Water 💧                  |
| **Lightning** ⚡   | Water 💧, Wind 💨                  | Earth ⛰️, Lightning ⚡             |
| **Earth** ⛰️       | Fire 🔥, Lightning ⚡, Poison ☠️   | Nature 🌿, Wind 💨                 |
| **Wind** 💨        | Nature 🌿, Lightning ⚡            | Earth ⛰️, Ice ❄️                   |
| **Psychic** 👁️     | Poison ☠️, Sun ☀️                  | Psychic 👁️                         |
| **Sun** ☀️         | Poison ☠️, Ice ❄️                  | Fire 🔥, Sun ☀️                    |
| **Poison** ☠️      | Sun ☀️, Nature 🌿                  | Earth ⛰️, Poison ☠️                |

---

## 3. CƠ CHẾ KHÓA LƯỢT NGỌC TRƯỢT (PLAYER SWAP MISS)

Để tăng tính thử thách và tính toán chiến thuật:

- Mỗi lượt đi, người chơi chỉ được phép thực hiện **duy nhất 1 hành động di chuyển ngọc**.
- Nếu người chơi thực hiện tráo ngọc nhưng **không tạo ra bất kỳ combo 3 ngọc thẳng hàng nào (miss)**:
  1. Hai ô ngọc sẽ tự động trượt ngược lại về vị trí cũ.
  2. Bàn cờ lập tức bị khóa, màn hình hiện thông báo: `❌ Swap missed! You lost your turn!`.
  3. Lượt chơi lập tức bị hủy bỏ và chuyển thẳng sang lượt của Boss.

---

## 4. CƠ CHẾ CỨU NGUY TỰ ĐỘNG (DYNAMIC DIFFICULTY ADJUSTMENT - DDA MISS)

Hệ thống DDA được thiết kế tinh tế nhằm tạo ra cảm giác lội ngược dòng đầy kịch tính cho người chơi khi cận kề cái chết:

- **Điều kiện kích hoạt**: Khi máu của người chơi bị giảm xuống **ngưỡng từ 30% trở xuống**.
- **Hành vi**: Boss sẽ chủ động **"bấm hụt" (miss swap)**:
  - Thay vì ăn ngọc gây dame, AI sẽ tìm một cặp ngọc kề nhau mà khi tráo **không tạo ra combo nào**.
  - Ngọc trượt về vị trí cũ, Boss hiện thông báo: `💀 Boss missed the swap! Turn passes to you!` và mất lượt hoàn toàn!

### 📈 Số Lượt Cứu Nguy Cho Phép Theo Cấp Độ (Level Scaling)

|     Cấp Độ Trận Đấu      | Số Lượt Cứu Nguy Tối Đa của Boss | Chi Tiết Trải Nghiệm Người Chơi                                                                            |
| :----------------------: | :------------------------------: | :--------------------------------------------------------------------------------------------------------- |
|     **Level 1 - 2**      |      **Vô Hạn (Infinity)**       | Hoàn toàn không thể chết. Người chơi luôn được cứu nguy liên tục ở 2 cấp độ đầu để làm quen game.          |
|     **Level 3 - 4**      |     **11 Lần (10 - 12 Lần)**     | Boss cứu nguy tối đa 11 lần, cho phép người chơi dễ thở nhưng bắt đầu có nguy cơ thua thực sự.             |
|       **Level 5**        |            **8 Lần**             | Giới hạn cứu giúp giảm xuống.                                                                              |
|       **Level 6**        |            **6 Lần**             | Thử thách tăng lên.                                                                                        |
|       **Level 7**        |            **5 Lần**             | Đòi hỏi người chơi biết dùng ngọc Giáp/Máu.                                                                |
|       **Level 8**        |            **4 Lần**             | Kịch tính cao độ.                                                                                          |
|       **Level 9**        |            **3 Lần**             | Cận kề nguy cơ bại trận thực tế.                                                                           |
| **Level 10 (Boss Cuối)** |      **2 Lần (1 - 3 Lần)**       | Thử thách tối thượng. Chỉ cứu nguy tối đa 2 lần, sau đó Boss đánh thật và có thể tiễn người chơi lên bảng! |

---

## 5. HỆ THỐNG HIỆU ỨNG TRẠNG THÁI (BUFFS & DEBUFFS MATRIX)

Cơ chế hiệu ứng trạng thái được quản lý bởi `StatusEffects.js`:

| Hiệu Ứng                |  Loại  | Cơ Chế Tác Động                                                                                        |
| :---------------------- | :----: | :----------------------------------------------------------------------------------------------------- |
| **Burn (Hỏa thiêu)**    | Debuff | Gây 3 sát thương bỏ qua Giáp ở đầu mỗi lượt. Kéo dài 2 lượt.                                           |
| **Poison (Độc lực)**    | Debuff | Gây 4 sát thương ở đầu mỗi lượt. Có khả năng cộng dồn vô hạn số tầng độc. Kéo dài 3 lượt.              |
| **Freeze (Đóng băng)**  | Debuff | Khóa cứng mục tiêu. Không thể di chuyển ngọc hoặc sử dụng kỹ năng. Kéo dài 1 lượt.                     |
| **Stun (Choáng)**       | Debuff | Làm tê liệt mục tiêu, bỏ qua lượt đi hiện tại ngay lập tức. Kéo dài 1 lượt.                            |
| **Shield (Giáp giam)**  |  Buff  | Tạo lớp lá chắn hấp thụ sát thương. Lớp lá chắn này sẽ chịu sát thương thay cho máu trước.             |
| **Pierce (Xuyên)**      |  Buff  | Sát thương gây ra sẽ bỏ qua hoàn toàn 50% chỉ số giáp hiện tại của đối thủ.                            |
| **Curse (Suy yếu)**     | Debuff | Giảm vĩnh viễn 30% toàn bộ lượng sát thương đầu ra của đối thủ trong vòng 2 lượt.                      |
| **Cleanse (Thanh tẩy)** |  Buff  | Xóa sạch lập tức toàn bộ các debuff bất lợi (Burn, Poison, Curse, Stun, Freeze) đang dính trên cơ thể. |

---

## 6. BÁO CÁO CẬP NHẬT TÍNH NĂNG ĐIỆN ẢNH & TƯƠNG TÁC KỸ NĂNG (WEEK 10 UPGRADES)

Trong bản cập nhật mới nhất, hệ thống trình diễn trận đấu và tương tác kỹ năng đã được nâng cấp toàn diện nhằm đem lại trải nghiệm cao cấp và trực quan nhất cho người chơi:

### 🎬 Trải Nghiệm Trận Đấu Điện Ảnh (Cinematic Battle Arena)

- **Cơ chế trượt bảng đấu thông minh (Board Sliding)**: Tự động di chuyển `board.container` và `boardBg` xuống dưới màn hình `600px` bằng GSAP khi bắt đầu chuỗi đòn đánh. Điều này giúp dọn sạch sân khấu cờ, mở ra không gian giao tranh hoành tráng trực diện giữa hai nhân vật Hero và Boss. Bàn cờ sẽ tự động trượt lên lại vị trí cũ khi kết thúc chuỗi đòn đánh.
- **Tăng kích thước projectiles cực đại**: Các đạn bay nguyên tố được nâng cấp kích thước cơ bản lên **`2.3x` - `2.7x`** kết hợp với hoạt ảnh sóng xung kích nổ (shockwave) và nứt vỡ đất đá phóng to thêm **`40%`** cho hiệu quả thị giác mãn nhãn.
- **Hộp phần thưởng Victory trung tâm**: Tái thiết kế màn hình chiến thắng bằng cách đặt một hộp kính mờ (glassmorphism) cỡ lớn `500x180` px có viền vàng neon lấp lánh ngay trung tâm. Bố cục dạng lưới 2x2 hiển thị siêu nét: Vàng (Gold 💰), Kinh nghiệm (EXP ✨), Mảnh nguyên tố (Shards 🔮) được phân màu đẹp mắt, cùng thông tin lên cấp/chiêu thức mới cực kỳ nổi bật.

### ⚡ Hệ Thống Kỹ Năng Luôn Tương Tác & Ra Chiêu Nhanh (UX Skill Bar)

- **Tương tác liên tục (Always Interactive)**: Khắc phục triệt để tình trạng các thẻ kỹ năng không phản hồi hoặc bị đơ khi bấm. Giờ đây, người chơi có thể nhấp chuột vào bất cứ kỹ năng nào ở thanh công cụ dưới bất kỳ điều kiện nào (kể cả khi đang bị hồi chiêu hay đang bị choáng) để xem chi tiết hướng dẫn và tác dụng của chiêu thức đó.
- **Bảng hướng dẫn nổi phát sáng neon (Neon Guidance Popups)**: Tích hợp hàm hiển thị thông tin nổi bật `showSkillGuidancePopup` ở chính giữa màn hình đấu (`x=600, y=330`). Viền bảng được thiết kế phát sáng neon đổi màu linh hoạt theo trạng thái:
  - 🟢 **Xanh lá phát sáng (`0x00e676`)** - Chiêu sẵn sàng và kích hoạt tức thì.
  - 🟠 **Màu hổ phách (`0xffa726`)** - Chiêu đang hồi (hiện số lượt hồi còn lại).
  - 🔴 **Màu đỏ thẫm (`0xff1744`)** - Người chơi đang bị choáng không thể dùng chiêu.
  - 🔵 **Màu xanh ngọc (`0x00e5ff`)** - Bảng ngọc đang bận xử lý đòn đánh.
  - 🟠 **Màu cam đỏ (`0xff8a65`)** - Đang trong lượt của đối thủ (Boss).
- **Ra chiêu trực tiếp không qua nhấp Boss**: Giản lược hóa thao tác điều khiển. Bấm vào chiêu tấn công Boss (như Fireball, Lightning, Bomb, Meteor Shower) sẽ tự động kích hoạt thẳng lên Boss ngay lập tức, hoàn toàn loại bỏ bước chọn mục tiêu thủ công rườm rà dễ gây bối rối trước đây.

### 🛡️ Khắc Phục Triệt Để Crash Console

- **Triệt tiêu Tween rác (Tween Garbage Collection)**: Cài đặt cơ chế kiểm soát GSAP thông minh, thực hiện triệt tiêu đệ quy toàn bộ các tween đang chạy trên các đối tượng hình ảnh trước khi thực hiện hàm hủy đối tượng (`destroy()`). Giúp game vận hành hoàn toàn ổn định và đạt **0 lỗi console (Zero crash error)**.

---

_Báo cáo được lập bởi Antigravity — Hệ thống Pair Programming AI hàng đầu từ Google DeepMind._
