/**
 * NotePrecisionPanel — matches iOS NotePrecisionPanel.swift + VelocityHandle.swift
 *
 * Handle shape (inverted L):
 *   [vel##]┃
 *          ┃ stem
 *          ┃
 *   ───────┃─── baseline
 *
 * Handle RIGHT edge = stem LEFT edge. Handle extends LEFT.
 */
import React, { memo, useMemo, useCallback, useRef, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ScrollView as GHScrollView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Canvas, Rect, RoundedRect, Line, vec } from '@shopify/react-native-skia';
import { runOnJS } from 'react-native-reanimated';
import { Text } from '../../../../components/Text';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { useTheme } from '../../../../theme';
import type { ClipNote } from '../../types';

const LABEL_COL = 60;
const BEAT_LABEL_H = 16;
const NOTE_AREA_H = 36;
const STEP_W = 24;
const HANDLE_W = STEP_W; // matches 1/16th note width
const HANDLE_H = 16;
const STEM_W = 2;
const BEATS_PER_BAR = 4;
const STEPS_PER_BEAT = 4;

const VEL_LEVELS = [
  { fraction: 1.0, label: '127' },
  { fraction: 0.75, label: '95' },
  { fraction: 0.5, label: '64' },
  { fraction: 0.25, label: '32' },
];

export interface NotePrecisionPanelProps {
  notes: ClipNote[];
  pitchIndex: number;
  pitchLabel: string;
  pitchMidiNumber: number;
  activeLengthInBars: number;
  trackColor: string;
  onClose?: () => void;
  onVelocityChange?: (noteIndex: number, velocity: number) => void;
}

export const NotePrecisionPanel = memo(function NotePrecisionPanel({
  notes,
  pitchLabel,
  pitchMidiNumber,
  activeLengthInBars,
  trackColor,
  onClose,
  onVelocityChange,
}: NotePrecisionPanelProps) {
  const { colors } = useTheme();

  const notesAtPitch = useMemo(
    () => notes.map((n, i) => ({ note: n, globalIdx: i })).filter(x => x.note.noteNumber === pitchMidiNumber),
    [notes, pitchMidiNumber]
  );

  const totalSteps = activeLengthInBars * BEATS_PER_BAR * STEPS_PER_BEAT;
  const totalWidth = totalSteps * STEP_W;
  const totalBeats = activeLengthInBars * BEATS_PER_BAR;

  const [velAreaH, setVelAreaH] = useState(120);

  // Drag state
  const [dragIdx, setDragIdx] = useState(-1);
  const [dragVel, setDragVel] = useState(0);
  const dragStartY = useRef(0);
  const dragStartVel = useRef(0);

  const handleVelDragStart = useCallback((idx: number, y: number) => {
    const entry = notesAtPitch[idx];
    if (!entry) return;
    setDragIdx(idx);
    setDragVel(entry.note.velocity);
    dragStartY.current = y;
    dragStartVel.current = entry.note.velocity;
  }, [notesAtPitch]);

  const handleVelDragUpdate = useCallback((y: number) => {
    const dy = y - dragStartY.current;
    const delta = -dy / velAreaH * 127;
    setDragVel(Math.round(Math.max(1, Math.min(127, dragStartVel.current + delta))));
  }, [velAreaH]);

  const handleVelDragEnd = useCallback(() => {
    if (dragIdx >= 0 && dragIdx < notesAtPitch.length) {
      onVelocityChange?.(notesAtPitch[dragIdx]!.globalIdx, dragVel);
    }
    setDragIdx(-1);
  }, [dragIdx, dragVel, notesAtPitch, onVelocityChange]);

  /** Compute handle + stem geometry for a note (matches native VelocityHandle positioning) */
  const noteGeom = useCallback((note: ClipNote, vel: number) => {
    const fraction = vel / 127;
    const usableH = velAreaH - HANDLE_H;
    const stemH = Math.max(STEM_W, fraction * usableH);

    // Handle and stem aligned at note start position.
    // Handle width = 1 step (16th note). Stem at right edge of handle.
    const noteStartX = (note.position / 0.25) * STEP_W;

    // Handle starts at note position
    const handleX = noteStartX;
    // Stem at right edge of handle
    const stemCenterX = noteStartX + HANDLE_W;
    const stemX = stemCenterX;
    const handleY = velAreaH - stemH - HANDLE_H;
    const stemTop = velAreaH - stemH;

    return { noteStartX, stemX, stemCenterX, stemH, stemTop, handleX, handleY, fraction };
  }, [velAreaH]);

  return (
    <View style={[styles.container, { backgroundColor: colors.mcBlack2 }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.mcBlack3 }]}>
        <Text variant="label" color={colors.mcWhite} style={{ flex: 1, fontSize: 13 }}>
          {pitchLabel}
        </Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <Icon icon={Icons.close} size={16} color={colors.mcWhite3} />
        </Pressable>
      </View>

      {/* Body: left ruler + scrollable timeline */}
      <View style={styles.body}>

        {/* Left ruler column */}
        <View style={[styles.leftCol, { width: LABEL_COL, backgroundColor: colors.mcBlack2 }]}>
          {/* Spacer for beat labels */}
          <View style={{ height: BEAT_LABEL_H }} />
          {/* NOTES label */}
          <View style={{ height: NOTE_AREA_H, justifyContent: 'center' }}>
            <Text variant="extraSmall" color={colors.mcWhite3} center style={styles.tinyLabel}>NOTES</Text>
          </View>
          {/* Velocity ruler */}
          <View
            style={{ flex: 1 }}
            onLayout={(e) => setVelAreaH(Math.max(60, e.nativeEvent.layout.height))}
          >
            {/* VEL label at top */}
            <Text variant="extraSmall" color={colors.mcWhite3} center style={[styles.tinyLabel, { marginTop: 4 }]}>VEL</Text>
            {/* Level ticks — positioned absolutely to match velocity area */}
            {VEL_LEVELS.map(l => (
              <View key={l.label} style={[styles.rulerTick, { top: (1 - l.fraction) * velAreaH }]}>
                <Text variant="extraSmall" color={colors.mcWhite3} style={styles.rulerNum}>{l.label}</Text>
                <View style={styles.rulerDash} />
              </View>
            ))}
          </View>
        </View>

        {/* Scrollable timeline — SINGLE ScrollView for everything */}
        <GHScrollView horizontal showsHorizontalScrollIndicator style={{ flex: 1 }}>
          <View style={{ width: Math.max(totalWidth, totalWidth + HANDLE_W) }}>

            {/* Beat labels */}
            <View style={{ height: BEAT_LABEL_H, flexDirection: 'row' }}>
              {Array.from({ length: totalBeats }, (_, i) => (
                <Text key={i} variant="extraSmall" color={colors.mcWhite3}
                  style={{ width: STEPS_PER_BEAT * STEP_W, fontSize: 8, paddingLeft: 2 }}>
                  {Math.floor(i / BEATS_PER_BAR) + 1}.{(i % BEATS_PER_BAR) + 1}
                </Text>
              ))}
            </View>

            {/* Note blocks */}
            <View style={{ height: NOTE_AREA_H }}>
              <Canvas style={StyleSheet.absoluteFill}>
                {Array.from({ length: totalSteps + 1 }, (_, s) => (
                  <Line key={s} p1={vec(s * STEP_W, 0)} p2={vec(s * STEP_W, NOTE_AREA_H)}
                    color={s % STEPS_PER_BEAT === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}
                    strokeWidth={0.5} />
                ))}
                {notesAtPitch.map(({ note }, i) => {
                  const x = (note.position / 0.25) * STEP_W;
                  const w = Math.max((note.duration / 0.25) * STEP_W - 1, STEP_W * 0.5);
                  return <RoundedRect key={i} x={x} y={2} width={w} height={NOTE_AREA_H - 4} r={3} color={trackColor} opacity={0.85} />;
                })}
              </Canvas>
              {notesAtPitch.length === 0 && (
                <View style={styles.emptyState}>
                  <Text variant="small" color={colors.mcWhite3}>No notes at {pitchLabel}</Text>
                </View>
              )}
            </View>

            {/* Velocity area — canvas + handles + labels ALL inside the scroll */}
            <View style={{ height: velAreaH }}>
              <Canvas style={StyleSheet.absoluteFill}>
                {/* Grid lines */}
                {VEL_LEVELS.map(l => {
                  const y = (1 - l.fraction) * velAreaH;
                  return <Line key={l.label} p1={vec(0, y)} p2={vec(totalWidth, y)} color="rgba(255,255,255,0.08)" strokeWidth={0.5} />;
                })}
                {/* Baseline */}
                <Line p1={vec(0, velAreaH - 1)} p2={vec(totalWidth, velAreaH - 1)} color="rgba(255,255,255,0.15)" strokeWidth={0.5} />

                {/* Stems — thin line from handle down to baseline */}
                {notesAtPitch.map(({ note }, i) => {
                  const vel = i === dragIdx ? dragVel : note.velocity;
                  const g = noteGeom(note, vel);
                  return (
                    <Rect key={`s${i}`}
                      x={g.stemX - STEM_W / 2} y={g.stemTop}
                      width={STEM_W} height={g.stemH}
                      color={trackColor} opacity={0.4} />
                  );
                })}

                {/* Handles — square rect, right edge touches stem */}
                {notesAtPitch.map(({ note }, i) => {
                  const vel = i === dragIdx ? dragVel : note.velocity;
                  const g = noteGeom(note, vel);
                  return (
                    <React.Fragment key={`h${i}`}>
                      <Rect x={g.handleX} y={g.handleY} width={HANDLE_W} height={HANDLE_H}
                        color={trackColor} opacity={0.3 + 0.7 * g.fraction} />
                      <Rect x={g.handleX} y={g.handleY} width={HANDLE_W} height={HANDLE_H}
                        color="rgba(255,255,255,0.3)" style="stroke" strokeWidth={0.5} />
                    </React.Fragment>
                  );
                })}
              </Canvas>

              {/* Velocity number labels — INSIDE the scroll container */}
              {notesAtPitch.map(({ note }, i) => {
                const vel = i === dragIdx ? dragVel : note.velocity;
                const g = noteGeom(note, vel);
                return (
                  <View key={`vl${i}`} pointerEvents="none"
                    style={{ position: 'absolute', left: g.handleX, top: g.handleY, width: HANDLE_W, height: HANDLE_H, justifyContent: 'center', alignItems: 'center' }}>
                    <Text variant="extraSmall" color={colors.mcWhite} style={{ fontSize: 8, fontFamily: 'monospace', fontWeight: '600' }}>{vel}</Text>
                  </View>
                );
              })}

              {/* Drag touch targets — INSIDE the scroll container */}
              {notesAtPitch.map(({ note }, i) => {
                const vel = i === dragIdx ? dragVel : note.velocity;
                const g = noteGeom(note, vel);
                return (
                  <VelDragTarget key={`dt${i}`} index={i}
                    x={g.handleX - 8} y={g.handleY - 8}
                    onDragStart={handleVelDragStart}
                    onDragUpdate={handleVelDragUpdate}
                    onDragEnd={handleVelDragEnd} />
                );
              })}
            </View>
          </View>
        </GHScrollView>
      </View>
    </View>
  );
});

const VelDragTarget = memo(function VelDragTarget({
  index, x, y, onDragStart, onDragUpdate, onDragEnd,
}: {
  index: number; x: number; y: number;
  onDragStart: (idx: number, y: number) => void;
  onDragUpdate: (y: number) => void;
  onDragEnd: () => void;
}) {
  const gesture = Gesture.Pan()
    .onStart((e) => { 'worklet'; runOnJS(onDragStart)(index, e.absoluteY); })
    .onUpdate((e) => { 'worklet'; runOnJS(onDragUpdate)(e.absoluteY); })
    .onEnd(() => { 'worklet'; runOnJS(onDragEnd)(); });

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ position: 'absolute', left: x, top: y, width: HANDLE_W + 16, height: HANDLE_H + 16 }} />
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, height: 28 },
  body: { flex: 1, flexDirection: 'row' },
  leftCol: { borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.1)' },
  tinyLabel: { fontSize: 8, fontWeight: '600' },
  rulerTick: { position: 'absolute', flexDirection: 'row', alignItems: 'center', left: 2, right: 0 },
  rulerNum: { fontSize: 7, width: 20, textAlign: 'right', marginRight: 4 },
  rulerDash: { flex: 1, height: 0.5, backgroundColor: 'rgba(255,255,255,0.1)' },
  emptyState: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
});
