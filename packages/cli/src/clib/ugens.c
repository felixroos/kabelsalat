#ifndef UGENS_H
#define UGENS_H

#include <math.h>
#include <stdlib.h>
#include <stdbool.h>

#define SAMPLE_RATE 44100
#define MAX_DELAY_TIME 10
#define CLOCK_PPQ 24
#define DELAY_BUFFER_LENGTH (MAX_DELAY_TIME * SAMPLE_RATE)
#define SAMPLE_TIME (1.0 / SAMPLE_RATE)
#define MAX(x, y) (((x) > (y)) ? (x) : (y))
#define MIN(x, y) (((x) < (y)) ? (x) : (y))
#define RANDOM_FLOAT ((float)arc4random() / (float)UINT32_MAX) // libbsd
//#define RANDOM_FLOAT ((float)rand() / (float)RAND_MAX) // stdlib
//#define RANDOM_FLOAT ((float)random() / (float)0x7FFFFFFF) // POSIX

// helpers

double lerp(double x, double y0, double y1)
{
  if (x >= 1)
    return y1;
  return y0 + x * (y1 - y0);
}

// a pair of values
// used to implement e.g. argmin and argmax
typedef struct pair {
   double a;
   double b;
} pair;

// SineOsc

typedef struct SineOsc
{
  double phase;
} SineOsc;

void SineOsc_init(SineOsc *osc)
{
  osc->phase = 0.0;
}

double SineOsc_update(SineOsc *osc, double freq, double x, double y)
{
  osc->phase += SAMPLE_TIME * freq;
  if (osc->phase >= 1.0)
    osc->phase -= 1.0; // Keeping phase in [0, 1)
  return sin(osc->phase * 2.0 * M_PI);
}

void *SineOsc_create()
{
  void *osc = malloc(sizeof(SineOsc));
  SineOsc_init((SineOsc *)osc);
  return (void *)osc;
}

// SawOsc

typedef struct SawOsc
{
  double phase;
} SawOsc;

void SawOsc_init(SawOsc *osc)
{
  osc->phase = 0.0;
}

/* double phasor_update(double phase, double freq)
{
  phase += SAMPLE_TIME * freq;
  if (phase >= 1.0)
    phase -= 1.0; // Keeping phase in [0, 1)
  return phase;
} */

double SawOsc_update(SawOsc *osc, double freq)
{
  osc->phase += SAMPLE_TIME * freq;
  if (osc->phase >= 1.0)
    osc->phase -= 1.0; // Keeping phase in [0, 1)
  return (osc->phase) * 2 - 1;
}

void *SawOsc_create()
{
  void *osc = malloc(sizeof(SawOsc));
  SawOsc_init((SawOsc *)osc);
  return (void *)osc;
}

// ADSRNode

// ADSRNode structure and state enumeration
typedef enum
{
  ADSR_OFF,
  ADSR_ATTACK,
  ADSR_DECAY,
  ADSR_SUSTAIN,
  ADSR_RELEASE
} ADSRState;

typedef struct ADSRNode
{
  ADSRState state;
  double startTime;
  double startVal;
} ADSRNode;

void ADSRNode_init(ADSRNode *env)
{
  env->state = ADSR_OFF;
  env->startTime = 0.0;
  env->startVal = 0.0;
}

double ADSRNode_update(ADSRNode *env, double curTime, double gate, double attack, double decay, double susVal, double release)
{
  switch (env->state)
  {
  case ADSR_OFF:
    if (gate > 0)
    {
      env->state = ADSR_ATTACK;
      env->startTime = curTime;
      env->startVal = 0.0;
    }
    return 0.0;

  case ADSR_ATTACK:
  {
    double time = curTime - env->startTime;
    if (time > attack)
    {
      env->state = ADSR_DECAY;
      env->startTime = curTime;
      return 1.0;
    }
    return lerp(time / attack, env->startVal, 1.0);
  }

  case ADSR_DECAY:
  {
    double time = curTime - env->startTime;
    double curVal = lerp(time / decay, 1.0, susVal);

    if (gate <= 0)
    {
      env->state = ADSR_RELEASE;
      env->startTime = curTime;
      env->startVal = curVal;
      return curVal;
    }

    if (time > decay)
    {
      env->state = ADSR_SUSTAIN;
      env->startTime = curTime;
      return susVal;
    }

    return curVal;
  }

  case ADSR_SUSTAIN:
    if (gate <= 0)
    {
      env->state = ADSR_RELEASE;
      env->startTime = curTime;
      env->startVal = susVal;
    }
    return susVal;

  case ADSR_RELEASE:
  {
    double time = curTime - env->startTime;
    if (time > release)
    {
      env->state = ADSR_OFF;
      return 0.0;
    }

    double curVal = lerp(time / release, env->startVal, 0.0);
    if (gate > 0)
    {
      env->state = ADSR_ATTACK;
      env->startTime = curTime;
      env->startVal = curVal;
    }
    return curVal;
  }
  }

  // Fallback case for invalid state
  // fprintf(stderr, "Invalid ADSR state\n");
  return 0.0;
}

void *ADSRNode_create()
{
  ADSRNode *env = (ADSRNode *)malloc(sizeof(ADSRNode));
  ADSRNode_init(env);
  return (void *)env;
}

// Filter

typedef struct Filter
{
  double s0;
  double s1;
} Filter;

void Filter_init(Filter *self)
{
  self->s0 = 0;
  self->s1 = 0;
}

double Filter_update(Filter *self, double input, double cutoff, double resonance)
{

  // Out of bound values can produce NaNs
  cutoff = fmin(cutoff, 1);
  resonance = fmax(resonance, 0);

  double c = pow(0.5, (1 - cutoff) / 0.125);
  double r = pow(0.5, (resonance + 0.125) / 0.125);
  double mrc = 1 - r * c;

  double v0 = self->s0;
  double v1 = self->s1;

  // Apply the filter to the sample
  v0 = mrc * v0 - c * v1 + c * input;
  v1 = mrc * v1 + c * v0;
  double output = v1;

  self->s0 = v0;
  self->s1 = v1;

  return output;
}

void *Filter_create()
{
  Filter *env = (Filter *)malloc(sizeof(Filter));
  Filter_init(env);
  return (void *)env;
}

// ImpulseOsc

typedef struct ImpulseOsc
{
  double phase;
} ImpulseOsc;

void ImpulseOsc_init(ImpulseOsc *self)
{
  self->phase = 1;
}

double ImpulseOsc_update(ImpulseOsc *self, double freq, double phase)
{
  self->phase += SAMPLE_TIME * freq;
  double v = self->phase >= 1 ? 1 : 0;
  if (self->phase >= 1.0)
    self->phase -= 1.0; // Keeping phase in [0, 1)
  return v;
}

void *ImpulseOsc_create()
{
  ImpulseOsc *env = (ImpulseOsc *)malloc(sizeof(ImpulseOsc));
  ImpulseOsc_init(env);
  return (void *)env;
}

// Lag

int lagUnit = 4410;

typedef struct Lag
{
  double s;
} Lag;

void Lag_init(Lag *self)
{
  self->s = 0;
}

double Lag_update(Lag *self, double input, double rate)
{
  // Remap so the useful range is around [0, 1]
  rate = rate * lagUnit;
  if (rate < 1)
    rate = 1;
  self->s += (1 / rate) * (input - self->s);
  return self->s;
}

void *Lag_create()
{
  Lag *env = (Lag *)malloc(sizeof(Lag));
  Lag_init(env);
  return (void *)env;
}

// Delay

typedef struct Delay
{
  int writeIdx;
  int readIdx;
  float buffer[DELAY_BUFFER_LENGTH];
} Delay;

void Delay_init(Delay *self)
{
  // Write and read positions in the buffer
  self->writeIdx = 0;
  self->readIdx = 0;
}

double Delay_update(Delay *self, double input, double time)
{

  self->writeIdx = (self->writeIdx + 1) % DELAY_BUFFER_LENGTH;
  self->buffer[self->writeIdx] = input;

  // Calculate how far in the past to read
  int numSamples = MIN(
      floor(SAMPLE_RATE * time),
      DELAY_BUFFER_LENGTH - 1);

  self->readIdx = self->writeIdx - numSamples;

  // If past the start of the buffer, wrap around
  if (self->readIdx < 0)
    self->readIdx += DELAY_BUFFER_LENGTH;

  return self->buffer[self->readIdx];
}

void *Delay_create()
{
  Delay *node = (Delay *)malloc(sizeof(Delay));
  Delay_init(node);
  return (void *)node;
}

// Output

typedef struct Output
{
  double value;
} Output;

void Output_init(Output *self)
{
  self->value = 0;
}

// TODO: find out what to do with id
double Output_update(Output *self, double value, int id)
{
  self->value = value;
  return self->value;
}

void *Output_create()
{
  Output *node = (Output *)malloc(sizeof(Output));
  Output_init(node);
  return (void *)node;
}

// Fold

typedef struct Fold
{
} Fold;

void Fold_init(Fold *self)
{
}

double Fold_update(Fold *self, double input, double rate)
{
  // Make it so rate 0 means input unaltered because
  // NoiseCraft knobs default to the [0, 1] range
  if (rate < 0)
    rate = 0;
  rate = rate + 1;

  input = input * rate;
  return (
      4 *
      (fabs(0.25 * input + 0.25 - roundf(0.25 * input + 0.25)) - 0.25));
}

void *Fold_create()
{
  Fold *node = (Fold *)malloc(sizeof(Fold));
  Fold_init(node);
  return (void *)node;
}

// BrownNoiseOsc

typedef struct BrownNoiseOsc
{
  float out;
} BrownNoiseOsc;

void BrownNoiseOsc_init(BrownNoiseOsc *self)
{
  self->out = 0;
}

double BrownNoiseOsc_update(BrownNoiseOsc *self)
{
  float white = RANDOM_FLOAT * 2.0 - 1.0;
  self->out = (self->out + 0.02 * white) / 1.02;
  return self->out;
}

void *BrownNoiseOsc_create()
{
  BrownNoiseOsc *node = (BrownNoiseOsc *)malloc(sizeof(BrownNoiseOsc));
  BrownNoiseOsc_init(node);
  return (void *)node;
}

// PinkNoise

typedef struct PinkNoise
{
  float b0;
  float b1;
  float b2;
  float b3;
  float b4;
  float b5;
  float b6;
} PinkNoise;

void PinkNoise_init(PinkNoise *self)
{

  self->b0 = 0;
  self->b1 = 0;
  self->b2 = 0;
  self->b3 = 0;
  self->b4 = 0;
  self->b5 = 0;
  self->b6 = 0;
}

double PinkNoise_update(PinkNoise *self)
{

  float white = RANDOM_FLOAT * 2 - 1;

  self->b0 = 0.99886 * self->b0 + white * 0.0555179;
  self->b1 = 0.99332 * self->b1 + white * 0.0750759;
  self->b2 = 0.969 * self->b2 + white * 0.153852;
  self->b3 = 0.8665 * self->b3 + white * 0.3104856;
  self->b4 = 0.55 * self->b4 + white * 0.5329522;
  self->b5 = -0.7616 * self->b5 - white * 0.016898;

  float pink =
      self->b0 +
      self->b1 +
      self->b2 +
      self->b3 +
      self->b4 +
      self->b5 +
      self->b6 +
      white * 0.5362;
  self->b6 = white * 0.115926;

  return pink * 0.11;
}

void *PinkNoise_create()
{
  PinkNoise *node = (PinkNoise *)malloc(sizeof(PinkNoise));
  PinkNoise_init(node);
  return (void *)node;
}

// NoiseOsc

typedef struct NoiseOsc
{
} NoiseOsc;

void NoiseOsc_init(NoiseOsc *self)
{
}

double NoiseOsc_update(NoiseOsc *self)
{
  return RANDOM_FLOAT * 2 - 1;
}

void *NoiseOsc_create()
{
  NoiseOsc *node = (NoiseOsc *)malloc(sizeof(NoiseOsc));
  NoiseOsc_init(node);
  return (void *)node;
}

// DustOsc

typedef struct DustOsc
{
} DustOsc;

double DustOsc_update(DustOsc *self, float density)
{
  return RANDOM_FLOAT < density * SAMPLE_TIME ? RANDOM_FLOAT : 0;
}

void *DustOsc_create()
{
  DustOsc *node = (DustOsc *)malloc(sizeof(DustOsc));
  return (void *)node;
}

// ClockDiv

typedef struct ClockDiv
{
  // Last clock sign at the input (positive/negative)
  bool inSgn;
  // Current clock sign at the output (positive/negative)
  // We start high to trigger immediately upon starting,
  // just like the Clock node
  bool outSgn;
  int clockCnt;

} ClockDiv;

void ClockDiv_init(ClockDiv *self)
{
  self->inSgn = true;
  self->outSgn = true;
  self->clockCnt = 0;
}

double ClockDiv_update(ClockDiv *self, float clock, float factor)
{

  // Current clock sign at the input
  bool curSgn = clock > 0;

  // If the input clock sign just flipped
  if (self->inSgn != curSgn)
  {
    // Count all edges, both rising and falling
    self->clockCnt++;

    // If we've reached the division factor
    // if (self->clockCnt >= factor) // <- og
    if (self->clockCnt >= factor)
    {
      // Reset the clock count
      self->clockCnt = 0;

      // Flip the output clock sign
      self->outSgn = !self->outSgn;
    }
  }

  self->inSgn = curSgn;

  return self->outSgn ? 1 : 0;
}

void *ClockDiv_create()
{
  ClockDiv *node = (ClockDiv *)malloc(sizeof(ClockDiv));
  ClockDiv_init(node);
  return (void *)node;
}

// Distort

typedef struct Distort
{
} Distort;

double Distort_update(Distort *self, float input, float amount)
{
  amount = MIN(MAX(amount, 0), 1);
  amount -= 0.01;

  float k = (2 * amount) / (1 - amount);
  float y = ((1 + k) * input) / (1 + k * fabs(input));
  return y;
}

void *Distort_create()
{
  Distort *node = (Distort *)malloc(sizeof(Distort));
  return (void *)node;
}

// Hold

typedef struct Hold
{
  float value;
  bool trigSgn;
} Hold;

void Hold_init(Hold *self)
{
  self->value = 0;
  self->trigSgn = false;
}

double Hold_update(Hold *self, float input, float trig)
{
  if (!self->trigSgn && trig > 0)
    self->value = input;

  self->trigSgn = trig > 0;
  return self->value;
}

void *Hold_create()
{
  Hold *node = (Hold *)malloc(sizeof(Hold));
  Hold_init(node);
  return (void *)node;
}

// PulseOsc

typedef struct PulseOsc
{
  float phase;
} PulseOsc;

void PulseOsc_init(PulseOsc *self)
{
  self->phase = 0;
}

double PulseOsc_update(PulseOsc *self, float freq, float duty)
{

  self->phase += SAMPLE_TIME * freq;
  if (self->phase >= 1.0)
    self->phase -= 1.0; // Keeping phase in [0, 1)

  return self->phase < duty ? 1 : -1;
}

void *PulseOsc_create()
{
  PulseOsc *node = (PulseOsc *)malloc(sizeof(PulseOsc));
  PulseOsc_init(node);
  return (void *)node;
}

// TriOsc

typedef struct TriOsc
{
  float phase;
} TriOsc;

void TriOsc_init(TriOsc *self)
{
  self->phase = 0;
}

double TriOsc_update(TriOsc *self, float freq)
{
  self->phase += SAMPLE_TIME * freq;
  if (self->phase >= 1.0)
    self->phase -= 1.0; // Keeping phase in [0, 1)
  return self->phase < 0.5 ? 2 * self->phase : 1 - 2 * (self->phase - 0.5);
}

void *TriOsc_create()
{
  TriOsc *node = (TriOsc *)malloc(sizeof(TriOsc));
  TriOsc_init(node);
  return (void *)node;
}

// Slew

typedef struct Slew
{
  float last;
} Slew;

void Slew_init(Slew *self)
{
  self->last = 0;
}

double Slew_update(Slew *self, float input, float up, float dn)
{
  float upStep = up * SAMPLE_TIME;
  float downStep = dn * SAMPLE_TIME;

  float delta = input - self->last;
  if (delta > upStep)
  {
    delta = upStep;
  }
  else if (delta < -downStep)
  {
    delta = -downStep;
  }
  self->last += delta;
  return self->last;
}

void *Slew_create()
{
  Slew *node = (Slew *)malloc(sizeof(Slew));
  Slew_init(node);
  return (void *)node;
}

// Sequence

typedef struct Sequence
{
  bool clockSgn;
  int step;
  int steps;
  float *sequence;
  bool first;
} Sequence;

void Sequence_init(Sequence *self)
{
  self->clockSgn = true;
  self->step = 0;
  self->first = true;
}

double Sequence_update(Sequence *self, float clock, int len, float *sequence)
{

  if (!self->clockSgn && clock > 0)
  {
    self->step = (self->step + 1);
    if (self->step >= len)
      self->step -= len;
    self->clockSgn = clock > 0;
    return 0; // set first sample to zero to retrigger gates on step change...
  }
  self->clockSgn = clock > 0;
  return sequence[self->step];
}

void *Sequence_create()
{
  Sequence *node = (Sequence *)malloc(sizeof(Sequence));
  Sequence_init(node);
  return (void *)node;
}

// Slide

typedef struct Slide
{
  double s;
} Slide;

void Slide_init(Slide *self)
{
  self->s = 0;
}

double Slide_update(Slide *self, double input, double rate)
{
  rate = rate * 1000;
  if (rate < 1)
    rate = 1;
  self->s += (1 / rate) * (input - self->s);
  return self->s;
}

void *Slide_create()
{
  Slide *env = (Slide *)malloc(sizeof(Slide));
  Slide_init(env);
  return (void *)env;
}

// Clock

typedef struct Clock
{
  float phase;
} Clock;

void Clock_init(Clock *self)
{
  self->phase = 0;
}

double Clock_update(Clock *self, float bpm)
{
  float freq = (CLOCK_PPQ * bpm) / 60;
  float duty = 0.5;
  self->phase += SAMPLE_TIME * freq;
  if (self->phase >= 1)
    self->phase -= 1;

  // Note that the clock starts high so that it will
  // trigger immediately upon starting
  return self->phase < duty ? 1 : -1;
}

void *Clock_create()
{
  Clock *node = (Clock *)malloc(sizeof(Clock));
  Clock_init(node);
  return (void *)node;
}

// Pick

typedef struct Pick {} Pick;

void Pick_init(Pick *self)
{
}

double Pick_update(Sequence *self, float index, int len, float *inputs)
{
    return inputs[((int) floor(index)) % len];
}

void *Pick_create()
{
  Pick *node = (Pick *)malloc(sizeof(Pick));
  Pick_init(node);
  return (void *)node;
}

#endif // UGENS_H

/*

- [x] ADSRNode
- [-] AudioIn
- [x] BrownNoiseOsc
- [-] CC
- [-] Clock
- [x] ClockDiv
- [-] ClockOut
- [x] Delay
- [x] Distort
- [x] DustOsc
- [x] Feedback
- [x] Filter
- [x] Fold
- [x] Hold
- [x] ImpulseOsc
- [x] Lag
- [-] MidiCC
- [-] MidiFreq
- [-] MidiGate
- [-] MidiIn
- [x] NoiseOsc
- [x] PinkNoise
- [x] PulseOsc
- [x] SawOsc
- [x] Sequence
- [x] SineOsc
- [x] Slew
- [x] Slide
- [x] TriOsc
- [ ] Output

*/

/*

// Template

typedef struct Template
{
} Template;

void Template_init(Template *self)
{
}

double Template_update(Template *self)
{
}

void *Template_create()
{
  Template *node = (Template *)malloc(sizeof(Template));
  Template_init(node);
  return (void *)node;
}

*/
