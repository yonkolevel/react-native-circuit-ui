/**
 * NotePrecisionPanel — matches iOS NotePrecisionPanel.swift + VelocityLaneView.swift
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────┐
 * │ PitchLabel                                     [X]  │  header 28px
 * ├──────┬──────────────────────────────────────────────┤
 * │      │ 1.1    1.2    1.3    1.4                    │  beat labels 16px
 * │NOTES │ [███]  [██]  [████]                         │  note blocks 36px
 * │ VEL  │  ┃      ┃     ┃                             │  velocity area (flex)
 * │ 127──│──╋──────╋─────╋──────────────────           │   stems + handles
 * │  95──│──╋──────╋─────╋──────────────────           │   handles: rect with
 * │  64──│──╋──────╋─────╋──────────────────           │    velocity number
 * │  32──│──╋──────╋─────╋──────────────────           │   draggable vertically
 * └──────┴──────────────────────────────────────────────┘
 *  60px        scrollable timeline
 *
 * Handle design (matching VelocityHandle.swift):
 * - Rectangle (square corners, NOT rounded)
 * - Fill: trackColor at opacity 0.3 + 0.7 * fraction
 * - Border: white at 0.3 opacity, 0.5px
 * - Contains velocity number in monospaced font
 * - Stem: thin line (2px) from handle down to baseline
 */
import React, { memo, useMemo, useCallback, useRef, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ScrollView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Canvas, Rect, RoundedRect, Line, vec } from '@shopify/react-native-skia';
import { runOnJS } from 'react-native-reanimated';
import { Text } from '../../../../components/Text';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { useTheme } from '../../../../theme';
import type { ClipNote } from '../../types';

const LABEL_COL = 60;
const BEAT_LABEL_H = 16;
const NOTE_AREA_H = 36;
const HANDLE_W = 32;
const HANDLE_H = 16;
const STEM_W = 2;
const BEATS_PER_BAR = 4;
const STEPS_PER_BEAT = 4;
const STEP_W = 24;

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

  // Velocity area height — measured from layout
  const [velAreaH, setVelAreaH] = useState(120);

  // Dragging state
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
    // Dragging down = lower velocity, up = higher
    const delta = -dy / velAreaH * 127;
    const newVel = Math.round(Math.max(1, Math.min(127, dragStartVel.current + delta)));
    setDragVel(newVel);
  }, [velAreaH]);

  const handleVelDragEnd = useCallback(() => {
    if (dragIdx >= 0 && dragIdx < notesAtPitch.length) {
      const globalIdx = notesAtPitch[dragIdx]!.globalIdx;
      onVelocityChange?.(globalIdx, dragVel);
    }
    setDragIdx(-1);
  }, [dragIdx, dragVel, notesAtPitch, onVelocityChange]);

  // Velocity levels for ruler
  const LEVELS = [
    { fraction: 1.0, label: '127' },
    { fraction: 0.75, label: '95' },
    { fraction: 0.5, label: '64' },
    { fraction: 0.25, label: '32' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.mcBlack2 }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.mcBlack3 }]}>
        <Text variant="label" color={colors.mcWhite} style={styles.headerTitle}>
          {pitchLabel}
        </Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <Icon icon={Icons.close} size={16} color={colors.mcWhite3} />
        </Pressable>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Left column */}
        <View style={[styles.leftCol, { width: LABEL_COL }]}>
          <View style={{ height: BEAT_LABEL_H }} />
          <View style={styles.leftLabelRow}>
            <Text variant="extraSmall" color={colors.mcWhite3} center style={styles.tiny}>NOTES</Text>
          </View>
          <View
            style={styles.velRulerCol}
            onLayout={(e) => setVelAreaH(Math.max(60, e.nativeEvent.layout.height))}
          >
            <Text variant="extraSmall" color={colors.mcWhite3} center style={styles.tiny}>VEL</Text>
            {LEVELS.map(l => (
              <View key={l.label} style={[styles.rulerRow, { top: `${(1 - l.fraction) * 100}%` as any }]}>
                <Text variant="extraSmall" color={colors.mcWhite3} style={styles.rulerLabel}>{l.label}</Text>
                <View style={styles.rulerLine} />
              </View>
            ))}
          </View>
        </View>

        {/* Timeline */}
        <ScrollView horizontal showsHorizontalScrollIndicator style={styles.timeline}>
          <View style={{ width: totalWidth }}>
            {/* Beat labels */}
            <View style={{ height: BEAT_LABEL_H, flexDirection: 'row' }}>
              {Array.from({ length: totalBeats }, (_, i) => (
                <Text key={i} variant="extraSmall" color={colors.mcWhite3} style={styles.beatLabel}>
                  {Math.floor(i / BEATS_PER_BAR) + 1}.{(i % BEATS_PER_BAR) + 1}
                </Text>
              ))}
            </View>

            {/* Note blocks area */}
            <View style={{ height: NOTE_AREA_H }}>
              <Canvas style={StyleSheet.absoluteFill}>
                {/* Step grid */}
                {Array.from({ length: totalSteps + 1 }, (_, s) => (
                  <Line key={s} p1={vec(s * STEP_W, 0)} p2={vec(s * STEP_W, NOTE_AREA_H)}
                    color={s % STEPS_PER_BEAT === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}
                    strokeWidth={0.5} />
                ))}
                {/* Note blocks */}
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

            {/* Velocity area */}
            <View style={{ flex: 1, minHeight: 80 }}>
              <Canvas style={StyleSheet.absoluteFill}>
                {/* Grid lines at velocity levels */}
                {LEVELS.map(l => {
                  const y = (1 - l.fraction) * velAreaH;
                  return <Line key={l.label} p1={vec(0, y)} p2={vec(totalWidth, y)} color="rgba(255,255,255,0.08)" strokeWidth={0.5} />;
                })}
                {/* Baseline */}
                <Line p1={vec(0, velAreaH)} p2={vec(totalWidth, velAreaH)} color="rgba(255,255,255,0.15)" strokeWidth={0.5} />

                {/* Stems */}
                {notesAtPitch.map(({ note }, i) => {
                  const vel = i === dragIdx ? dragVel : note.velocity;
                  const fraction = vel / 127;
                  const usableH = velAreaH - HANDLE_H;
                  const stemH = Math.max(STEM_W, fraction * usableH);
                  const centerX = (note.position / 0.25) * STEP_W + HANDLE_W / 2;
                  return (
                    <Rect key={`s${i}`}
                      x={centerX - STEM_W / 2} y={velAreaH - stemH}
                      width={STEM_W} height={stemH}
                      color={trackColor} opacity={0.4} />
                  );
                })}

                {/* Handles — rectangles with velocity number (drawn as colored rect) */}
                {notesAtPitch.map(({ note }, i) => {
                  const vel = i === dragIdx ? dragVel : note.velocity;
                  const fraction = vel / 127;
                  const usableH = velAreaH - HANDLE_H;
                  const stemH = Math.max(STEM_W, fraction * usableH);
                  const centerX = (note.position / 0.25) * STEP_W + HANDLE_W / 2;
                  const handleY = velAreaH - stemH - HANDLE_H / 2;
                  const handleX = centerX - HANDLE_W / 2;
                  const opacity = 0.3 + 0.7 * fraction;
                  return (
                    <React.Fragment key={`h${i}`}>
                      {/* Handle background */}
                      <Rect x={handleX} y={handleY} width={HANDLE_W} height={HANDLE_H} color={trackColor} opacity={opacity} />
                      {/* Handle border */}
                      <Rect x={handleX} y={handleY} width={HANDLE_W} height={HANDLE_H}
                        color="rgba(255,255,255,0.3)" style="stroke" strokeWidth={0.5} />
                    </React.Fragment>
                  );
                })}
              </Canvas>

              {/* Velocity number labels (React Text — Skia text is complex) */}
              {notesAtPitch.map(({ note }, i) => {
                const vel = i === dragIdx ? dragVel : note.velocity;
                const fraction = vel / 127;
                const usableH = velAreaH - HANDLE_H;
                const stemH = Math.max(STEM_W, fraction * usableH);
                const centerX = (note.position / 0.25) * STEP_W + HANDLE_W / 2;
                const handleY = velAreaH - stemH - HANDLE_H / 2;
                const handleX = centerX - HANDLE_W / 2;
                return (
                  <View key={`vl${i}`} style={[styles.velLabel, { left: handleX, top: handleY, width: HANDLE_W, height: HANDLE_H }]} pointerEvents="none">
                    <Text variant="extraSmall" color={colors.mcWhite} style={styles.velText}>{vel}</Text>
                  </View>
                );
              })}

              {/* Drag touch targets */}
              {notesAtPitch.map(({ note }, i) => {
                const vel = i === dragIdx ? dragVel : note.velocity;
                const fraction = vel / 127;
                const usableH = velAreaH - HANDLE_H;
                const stemH = Math.max(STEM_W, fraction * usableH);
                const centerX = (note.position / 0.25) * STEP_W + HANDLE_W / 2;
                const handleY = velAreaH - stemH - HANDLE_H / 2;
                const handleX = centerX - HANDLE_W / 2;
                return (
                  <VelDragTarget
                    key={`dt${i}`}
                    index={i}
                    x={handleX}
                    y={handleY}
                    onDragStart={handleVelDragStart}
                    onDragUpdate={handleVelDragUpdate}
                    onDragEnd={handleVelDragEnd}
                  />
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
});

/** Invisible drag target for a velocity handle */
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
      <View style={{
        position: 'absolute', left: x - 8, top: y - 8,
        width: HANDLE_W + 16, height: HANDLE_H + 16,
      }} />
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, height: 28 },
  headerTitle: { flex: 1, fontSize: 13 },
  body: { flex: 1, flexDirection: 'row' },
  leftCol: {},
  leftLabelRow: { height: NOTE_AREA_H, justifyContent: 'center', alignItems: 'center' },
  tiny: { fontSize: 8, fontWeight: '600' },
  velRulerCol: { flex: 1, position: 'relative' },
  rulerRow: { position: 'absolute', flexDirection: 'row', alignItems: 'center', left: 0, right: 0 },
  rulerLabel: { fontSize: 7, width: 22, textAlign: 'right', marginRight: 4 },
  rulerLine: { flex: 1, height: 0.5, backgroundColor: 'rgba(255,255,255,0.1)' },
  timeline: { flex: 1 },
  beatLabel: { width: STEPS_PER_BEAT * STEP_W, fontSize: 8, paddingLeft: 2 },
  emptyState: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  velLabel: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  velText: { fontSize: 8, fontFamily: 'monospace', fontWeight: '600' },
});
