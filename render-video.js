#!/usr/bin/env node

/**
 * Remotion 视频渲染脚本
 * 用法: node render-video.js
 */

const { execSync } = require("child_process");
const path = require("path");

console.log("🎬 开始渲染开场视频...\n");

const props = JSON.stringify({ playerName: "小麦老师" });
const outputFile = path.join(__dirname, "public", "farm-prologue.mp4");
const command = `npx remotion render FarmPrologue "${outputFile}" --props='${props}' --concurrency=10 --timeout=180000`;

console.log(`命令: ${command}\n`);

try {
  execSync(command, {
    stdio: "inherit",
    cwd: __dirname,
  });
  console.log("\n✅ 视频渲染完成！");
  console.log(`📁 文件位置: ${outputFile}`);
} catch (error) {
  console.error("\n❌ 渲染失败:", error.message);
  process.exit(1);
}
