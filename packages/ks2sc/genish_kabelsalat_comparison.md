# genish / kabelsalat comparison

- [genish reference](https://www.charlie-roberts.com/genish/docs/index.html)
- [kabelsalat reference](https://kabel.salat.dev/reference/)

|  genish  | gen     | kabelsalat | comment                                                                                       |
| -------- | ------- | ---------- | --------------------------------------------------------------------------------------------- |
| accum    |         |            | [counter ugen](https://github.com/felixroos/kabelsalat/issues/67)                             |
| acos     | acos    | acos       |                                                                                               |
| ad       |         | ad         |                                                                                               |
| add      | add     | add        |                                                                                               |
| adsr     |         | adsr       |                                                                                               |
| and      | and     | and        |                                                                                               |
| asin     | asin    | asin       |                                                                                               |
| atan     | atan    | atan       |                                                                                               |
| bang     |         |            | [cc + setControls](https://github.com/felixroos/kabelsalat/issues/66)                         |
| bool     | bool    | bool       |                                                                                               |
| ceil     | ceil    | ceil       |                                                                                               |
| clamp    | clamp   | clamp      |                                                                                               |
| cos      | cos     | cos        |                                                                                               |
| counter  | counter |            | [counter ugen](https://github.com/felixroos/kabelsalat/issues/67)                             |
| cycle    | cycle   | sine       |                                                                                               |
| data     | data    |            | tbd                                                                                           |
| dcblock  | dcblock |            | tbd                                                                                           |
| delay    | delay   | delay      | kabelsalat delay is in seconds [see issue](https://github.com/felixroos/kabelsalat/issues/68) |
| div      | div     | div        |                                                                                               |
| eq       | eq      | and        | should be same right?                                                                         |
| floor    | floor   | floor      |                                                                                               |
| fold     | fold    | fold       | kabelsalat fold seems more complex                                                            |
| gate     | gate    | pick?      |                                                                                               |
| gt       | gt      | greater    |                                                                                               |
| gtp      | gtp     |            | tbd                                                                                           |
| history  | history |            | out/src or lambda feedback                                                                    |
| ifelse   | ifelse  | ifelse     | currently no dynamic arity                                                                    |
| input    | in      | cc         | [doc issue](https://github.com/felixroos/kabelsalat/issues/69)                                |
| lt       | lt      | lower      |                                                                                               |
| ltp      | ltp     |            | tbd                                                                                           |
| max      | max     | max        |                                                                                               |
| min      | min     | min        |                                                                                               |
| mod      | mod     | mod        |                                                                                               |
| mul      | mul     | mul        |                                                                                               |
| noise    | noise   | noise      |                                                                                               |
| not      | not     | not        |                                                                                               |
| param    | param   | cc         | [doc issue](https://github.com/felixroos/kabelsalat/issues/69)                                |
|          |  mix    | (lerp)     | lerp is not a node (but could be...)                                                          |
| peek     |         |            | tbd                                                                                           |
| phasor   |         | zaw        |                                                                                               |
| poke     |         |            | tbd                                                                                           |
| round    |         | round      |                                                                                               |
| selector |         | pick       |                                                                                               |
| sign     |         | sign       |                                                                                               |
| sin      |         | sin        |                                                                                               |
| slide    |         | slide/lag  |                                                                                               |
| sub      |         | sub        |                                                                                               |
| switch   |         | pick       |                                                                                               |
| t60      |         |            | tbd                                                                                           |
| tan      |         | tan        |                                                                                               |
| train    |         | pulse      |                                                                                               |
| wrap     |         |            | tbd                                                                                           |
|          |         | abs        |                                                                                               |
|          |         | ar         |                                                                                               |
|          |         | argmin     |                                                                                               |
|          |         | audioin    |                                                                                               |
|          |         | bipolar    |                                                                                               |
|          |         | bpf        |                                                                                               |
|          |         | brown      |                                                                                               |
|          |         | bytebeat   |                                                                                               |
|          |         | clip       |                                                                                               |
|          |         | clockdiv   |                                                                                               |
|          |         | debug      |                                                                                               |
|          |         | distort    |                                                                                               |
|          |         | dust       |                                                                                               |
|          |         | exp        |                                                                                               |
|          |         | floatbeat  |                                                                                               |
|          |         | fork       |                                                                                               |
|          |         | hold       |                                                                                               |
|          |         | hpf        |                                                                                               |
|          |         | impulse    |                                                                                               |
|          |         | lfnoise    |                                                                                               |
|          |         | lpf        |                                                                                               |
|          |         | map        |                                                                                               |
|          |         | midicc     |                                                                                               |
|          |         | midifreq   |                                                                                               |
|          |         | midigate   |                                                                                               |
|          |         | midinote   |                                                                                               |
|          |         | mix        |                                                                                               |
|          |         | mouseX     |                                                                                               |
|          |         | mouseY     |                                                                                               |
|          |         | or         |                                                                                               |
|          |         | pan        |                                                                                               |
|          |         | perc       |                                                                                               |
|          |         | pick       |                                                                                               |
|          |         | pink       |                                                                                               |
|          |         | pow        |                                                                                               |
|          |         | range      |                                                                                               |
|          |         | rangex     |                                                                                               |
|          |         | raw        |                                                                                               |
|          |         | register   |                                                                                               |
|          |         | remap      |                                                                                               |
|          |         | saw        |                                                                                               |
|          |         | select     |                                                                                               |
|          |         | seq        |                                                                                               |
|          |         | signal     |                                                                                               |
|          |         | slew       |                                                                                               |
|          |         | split      |                                                                                               |
|          |         | thru       |                                                                                               |
|          |         | time       |                                                                                               |
|          |         | tri        |                                                                                               |
|          |         | trig       |                                                                                               |
|          |         | unipolar   |                                                                                               |
|          |         | xor        |                                                                                               |

- add functions to convert seconds <-> samples
