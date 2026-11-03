#!/usr/bin/env python3
"""Encode 240 frames and raw stereo WAV, master AAC, and report measured compliance."""
import argparse,json,re,shutil,subprocess
from pathlib import Path
ap=argparse.ArgumentParser();ap.add_argument('project',type=Path);ap.add_argument('--output',type=Path,required=True);ap.add_argument('--ffmpeg',default=shutil.which('ffmpeg'));a=ap.parse_args()
if not a.ffmpeg:raise SystemExit('FFmpeg unavailable. Pass --ffmpeg /path/to/ffmpeg.')
p=a.project.resolve();o=a.output.resolve();o.mkdir(parents=True,exist_ok=True)
if any(not (p/'frames'/f'{i:04}.png').exists() for i in range(240)):raise SystemExit('Need frames 0000 through 0239 before final encoding.')
if not (p/'audio-raw.wav').exists():raise SystemExit('Run audio.py first.')
def run(args):
 r=subprocess.run([a.ffmpeg,'-hide_banner','-y']+list(map(str,args)),capture_output=True,text=True)
 if r.returncode:raise RuntimeError(r.stderr[-4000:])
 return r.stderr
def measure(file):
 s=run(['-i',file,'-vn','-af','loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json','-f','null','-'])
 return json.loads(re.findall(r'\{[^{}]+\}',s)[-1])
m=measure(p/'audio-raw.wav')
f='loudnorm=I=-14:TP=-1.5:LRA=7:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}:linear=false'.format(**m)
run(['-i',p/'audio-raw.wav','-af',f,'-ar',48000,'-c:a','pcm_s24le',p/'audio-master.wav'])
run(['-framerate',24,'-i',p/'frames/%04d.png','-c:v','libx264','-preset','slow','-crf',17,'-pix_fmt','yuv420p','-profile:v','high','-level:v','4.1','-frames:v',240,p/'picture.mp4'])
gain=0;success=False
for attempt in range(4):
 run(['-i',p/'picture.mp4','-i',p/'audio-master.wav','-map','0:v:0','-map','1:a:0','-c:v','copy','-af',f'volume={gain}dB','-c:a','aac','-b:a','320k','-ar',48000,'-ac',2,'-t',10,'-movflags','+faststart',o/'video.mp4'])
 m=measure(o/'video.mp4');print('AAC measurement:',m['input_i'],'LUFS;',m['input_tp'],'dBTP',flush=True)
 if abs(float(m['input_i'])+14)<=.05 and float(m['input_tp'])<=-1:success=True;break
 if float(m['input_tp'])>-1:break
 gain+=-14-float(m['input_i'])
log=run(['-i',o/'video.mp4','-vf','blackdetect=d=0.04:pix_th=0.1','-f','null','-'])
(o/'verification.log').write_text(log)
counts=re.findall(r'frame=\s*(\d+)',log)
checks={'duration_seconds':10.0,'resolution':'1920x1080','fps':24,'decoded_frames':int(counts[-1]) if counts else None,'audio':'AAC stereo 48000 Hz','integrated_lufs':float(m['input_i']),'true_peak_dbtp':float(m['input_tp']),'gain_correction_db':gain,'black_frames_detected':'black_start:' in log,'loudness_pass':success}
checks['technical_pass']=success and checks['decoded_frames']==240 and not checks['black_frames_detected'] and '1920x1080' in log and '24 fps' in log and '48000 Hz, stereo' in log and 'Duration: 00:00:10.00' in log
(o/'verification.json').write_text(json.dumps(checks,indent=2)+'\n')
if not checks['technical_pass']:raise SystemExit('Verification failed: inspect verification.json/log. If peak is high, reduce mastering TP target and repeat; do not claim compliance.')
print('Technical verification: PASS')
