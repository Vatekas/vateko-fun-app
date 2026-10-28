// Wraps the NSIS installer (dist/Vateko.fun-Core.exe) in the Hydra-style setup window -> dist/Vateko.fun-Setup.exe.
// Runs after electron-builder in `npm run dist`. Uses the C# compiler that ships with Windows (.NET Framework 4.8).
// Setup.cs was recovered from the v1.0.1 release (decompiled) after the project folder was lost on 2026-10-28.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..', '..');
const dist = path.join(root, 'dist');
const fw = path.join(process.env.WINDIR, 'Microsoft.NET', 'Framework64', 'v4.0.30319');
const size = dir => fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? size(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);

const version = require(path.join(root, 'package.json')).version;
const gen = path.join(__dirname, 'Build.g.cs');
fs.writeFileSync(gen, `static class Build { public const string Version = "${version}"; public const long UnpackedBytes = ${size(path.join(dist, 'win-unpacked'))}; }\n`);

const core = path.join(dist, 'Vateko.fun-Core.exe');
if (!fs.existsSync(core)) throw new Error(`missing ${core}: run electron-builder first`);
const out = path.join(dist, 'Vateko.fun-Setup.exe');
execFileSync(path.join(fw, 'csc.exe'), [
  '/nologo', '/target:winexe', '/optimize+', '/codepage:65001', `/out:${out}`,
  `/win32icon:${path.join(root, 'build', 'icon.ico')}`,
  `/resource:${core},core.exe`,
  ...['SpaceGrotesk-Medium.ttf', 'SpaceGrotesk-Bold.ttf'].map(f => `/resource:${path.join(__dirname, 'fonts', f)},${f}`),
  ...['WPF\\PresentationFramework.dll', 'WPF\\PresentationCore.dll', 'WPF\\WindowsBase.dll', 'System.Xaml.dll', 'System.Core.dll', 'System.Management.dll'].map(r => `/r:${path.join(fw, r)}`),
  path.join(__dirname, 'Setup.cs'), gen,
], { stdio: 'inherit' });
console.log(`setup: ${out} (${(fs.statSync(out).size / 1048576).toFixed(0)} MB)`);
