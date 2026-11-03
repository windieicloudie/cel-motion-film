"""Original deterministic score and cel sound effects. No sampled external assets."""
import json, wave
from pathlib import Path
import numpy as np
ROOT=Path(__file__).parent
C=json.loads((ROOT/'cues.json').read_text())
SR=48000; N=SR*10; out=np.zeros((N,2),dtype=np.float64); rng=np.random.default_rng(240156)
cue={x['name']:x['frame']/C['fps'] for x in C['beats']}
def add(sig,t,gain=1,pan=0):
 i=round(t*SR); l=min(len(sig),N-i)
 if l<=0:return
 a=np.sqrt((1-pan)/2);b=np.sqrt((1+pan)/2)
 out[i:i+l,0]+=sig[:l]*gain*a;out[i:i+l,1]+=sig[:l]*gain*b
 # short asymmetric room taps keep the tiny ensemble in a physical space
 for delay,level,p in [(.039,.075,-pan),(.071,.045,pan)]:
  j=i+int(delay*SR);ll=min(len(sig),N-j)
  if ll>0:out[j:j+ll,0]+=sig[:ll]*gain*level*np.sqrt((1-p)/2);out[j:j+ll,1]+=sig[:ll]*gain*level*np.sqrt((1+p)/2)
def hz(m):return 440*2**((m-69)/12)
def mallet(m,d=.5):
 t=np.arange(int(SR*d))/SR;f=hz(m)
 y=np.sin(2*np.pi*f*t)*np.exp(-t*8)+.28*np.sin(2*np.pi*f*3.99*t)*np.exp(-t*23)+.11*np.sin(2*np.pi*f*9.8*t)*np.exp(-t*40)
 return y*(1-np.exp(-t*1500))*.4
def pluck(m,d=.5):
 t=np.arange(int(SR*d))/SR;f=hz(m)
 y=sum(np.sin(2*np.pi*f*k*t+.09*k)*np.exp(-t*(4+k*1.9))/k**1.5 for k in range(1,7))
 return y*(1-np.exp(-t*800))*.5
def noise(d):return rng.normal(0,1,int(d*SR))
def brush(d=.12):
 t=np.arange(int(d*SR))/SR;z=noise(d);z=np.concatenate([[0],np.diff(z)])
 return z*np.exp(-t*36)*.055
def kick():
 t=np.arange(int(.18*SR))/SR;f=52+80*np.exp(-t*55)
 return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*25)*.45
# 144 BPM, a six-bar miniature. Swing eighths; C6 / A7 / Dm7 / G9.
beat=60/144
chords=[[48,55,60,64],[45,52,57,61],[50,57,60,65],[43,50,59,65],[48,55,60,64],[48,55,60,69]]
melody=[76,79,81,79, 76,74,72,74, 77,81,84,81, 79,77,74,71, 72,76,79,84, 88,84,81,79]
for b in range(21):
 t=.0+b*beat;bar=min(b//4,5);ch=chords[bar]
 add(pluck(ch[b%2]),t,.24,-.26)
 if b%2==0:add(kick(),t,.16,0)
 else:add(brush(.16),t,.26,.28)
 if not 12<=b<=13:
  add(mallet(melody[b]),t+.01,.24,.22)
  if b%4 in (1,3):add(mallet(melody[b]+(3 if b%4==1 else -2),.3),t+beat*.66,.13,-.34)
 if b%2==1:
  for j,m in enumerate(ch[1:]):add(pluck(m+12,.24),t+.03+j*.008,.075,-.12+j*.13)
 for sub in [0,.66]:add(brush(.055),t+sub*beat,.1,.4)
# Dry match strike, rising flame whoosh, voiced cartoon pops.
def whoosh(d=.3,rise=True):
 t=np.arange(int(d*SR))/SR;z=noise(d);smooth=np.convolve(z,np.ones(23)/23,mode='same');env=np.sin(np.pi*t/d)**1.7
 carrier=np.sin(2*np.pi*(150*t+850*t*t/d))*.08
 return (smooth*.8+carrier)*env
add(brush(.17),cue['strike'],1.8,-.25)
add(whoosh(.4),cue['strike'],.6,-.1)
for dt in [0,.027,.073]:add(brush(.025),cue['strike']+dt,.6,.1)
def pop(f=650,d=.15):
 t=np.arange(int(d*SR))/SR;phase=2*np.pi*f*(t-1.7*t*t)
 return np.sin(phase)*np.exp(-t*25)*(1-np.exp(-t*1600))*.45
add(pop(950,.19),cue['birth'],.75,.1)
add(pop(145,.22),cue['land'],.72,0)
for j in range(1,7):
 t=cue['step'+str(j)];add(pop(330+j*65,.10),t,.31,(-1)**j*.25);add(brush(.05),t,.35,0)
# Little ratchet during anticipation; rising pitch on the one-frame stretch.
for j in range(5):add(pop(150+j*45,.07),cue['anticipate']+j/24,.2,0)
add(whoosh(.45),cue['launch'],.9,0)
# Hero: bright wood chord, breathy poof and sparkles over a bass accent.
add(whoosh(.5),cue['hero'],.8,0);add(kick(),cue['hero'],.55,0)
for j,m in enumerate([60,64,67,69,76,79,84]):add(mallet(m,.9),cue['hero']+j*.018,.25,(j-3)*.17)
for j in range(9):add(mallet(84+[0,4,7,12][j%4],.32),cue['hero']+.15+j*.062,.13,(-1)**j*.6)
add(whoosh(.35),cue['reform'],.45,0)
for j in range(1,1+sum(x['name'].startswith('letter') for x in C['beats'])):
 add(pop(360+j*62,.10),cue['letter'+str(j)],.29,max(-.75,min(.75,(j-4.5)*.12)))
 add(mallet([72,76,79,81,76,79,84,88][(j-1)%8],.32),cue['letter'+str(j)],.18,max(-.75,min(.75,(j-4.5)*.12)))
# Ending C6/9, one second living hold with natural decay.
for j,m in enumerate([48,60,64,67,69,74,79]):add(pluck(m,1.0) if m<70 else mallet(m,1.0),cue['resolve']+j*.004,.28 if m<60 else .17,(j-3)*.16)
# Guaranteed clean boundaries; mastering is performed after synthesis by ffmpeg.
out[:240]*=np.linspace(0,1,240)[:,None];out[-2400:]*=np.linspace(1,0,2400)[:,None]
out*=.82/max(1,np.max(np.abs(out)))
with wave.open(str(ROOT/'audio-raw.wav'),'wb') as f:
 f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes((out*32767).astype('<i2').tobytes())
print('Rendered 480000 stereo samples; peak',round(float(np.max(np.abs(out))),4))
