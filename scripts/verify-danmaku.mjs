import { bundleCore } from './lib/bundle-core.mjs';

const core = await bundleCore('verify-danmaku');
const site = new core.DouyinSite();

const recommend = await site.getRecommendRooms(1);
const room = recommend.items[0];
console.log(`房间: ${room.roomId} | ${room.title} | ${room.userName}`);

const detail = await site.getRoomDetail(room.roomId);
console.log(`状态: ${detail.status}, 在线: ${detail.online}`);

const client = new core.DouyinDanmakuClient();
const stats = { chat: 0, online: 0, samples: [], onlines: [] };

client.onReady = () => console.log('✅ 弹幕连接就绪');
client.onClose = (msg) => console.log('连接关闭:', msg);
client.onMessage = (msg) => {
  if (msg.type === 'chat') {
    stats.chat++;
    if (stats.samples.length < 5) {
      stats.samples.push(`${msg.userName}: ${msg.message}`);
    }
  } else if (msg.type === 'online') {
    stats.online++;
    stats.onlines.push(msg.online);
  }
};

client.start(detail.danmakuData);
console.log('已发起连接，开始接收...');

const duration = Number(process.argv[2] ?? 30) * 1000;
setTimeout(() => {
  console.log('\n=== 统计 ===');
  console.log(`弹幕消息: ${stats.chat} 条`);
  console.log(`在线人数更新: ${stats.online} 次`);
  if (stats.samples.length) {
    console.log('弹幕示例:');
    for (const s of stats.samples) {
      console.log(`   ${s}`);
    }
  }
  if (stats.onlines.length) {
    console.log(`最新在线人数: ${stats.onlines[stats.onlines.length - 1]}`);
  }
  client.stop();
  process.exit(0);
}, duration);
