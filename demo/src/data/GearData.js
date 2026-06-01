/**
 * @file GearData.js
 * @description Database for Weapons, Armor, and Relics.
 */

export const GEAR_DATABASE = {
    weapons: [
        {
            id: 'magic_sword',
            name: 'Kiếm Ma Thuật',
            slot: 'weapon',
            description: '+15 Sát thương Lôi ⚡. Nội tại: Tạo Combo 4+ biến 1 viên ngọc thường thành ngọc Lôi.',
            price: 150,
            emoji: '⚡⚔️',
            color: '#ffd740',
            stats: {
                lightningDmg: 15
            }
        }
    ],
    armor: [
        {
            id: 'stone_plate',
            name: 'Giáp Gai Thạch Bản',
            slot: 'armor',
            description: '+50 Max HP, +20 Giáp khởi đầu. Nội tại: Phản 20% sát thương vật lý của Boss thành sát thương hệ Thổ ⛰️.',
            price: 180,
            emoji: '🛡️⛰️',
            color: '#bcaaa4',
            stats: {
                maxHP: 50,
                startShield: 20,
                reflectPercent: 0.20
            }
        }
    ],
    relics: [
        {
            id: 'vampiric_fang',
            name: 'Nanh Ma Cà Rồng',
            slot: 'relic',
            description: 'Nội tại: Hồi máu bằng 15% lượng sát thương gây ra khi nổ ngọc hệ Độc ☠️ hoặc Hỏa 🔥.',
            price: 200,
            emoji: '🧛☠️',
            color: '#ff5252'
        },
        {
            id: 'time_hourglass',
            name: 'Đồng Hồ Cát Thời Gian',
            slot: 'relic',
            description: 'Nội tại: Mỗi 5 lượt đi, tự động thanh tẩy (Cleanse) toàn bộ hiệu ứng bất lợi.',
            price: 220,
            emoji: '⏳✨',
            color: '#80d8ff'
        },
        {
            id: 'chaos_eye',
            name: 'Mắt Bão Hỗn Loạn',
            slot: 'relic',
            description: 'Nội tại: Đổi hệ Boss sang hệ bị khắc chế yếu nhất khi bắt đầu để gây 2.0x sát thương.',
            price: 250,
            emoji: '👁️🌪️',
            color: '#e040fb'
        }
    ]
};

/**
 * Helper to find gear item details by ID.
 * @param {string} itemId 
 * @returns {object|null}
 */
export function getGearItemById(itemId) {
    if (!itemId) return null;
    for (const category of ['weapons', 'armor', 'relics']) {
        const found = GEAR_DATABASE[category].find(item => item.id === itemId);
        if (found) return found;
    }
    return null;
}
