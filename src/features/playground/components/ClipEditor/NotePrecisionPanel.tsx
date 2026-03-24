/**
 * NotePrecisionPanel — matches iOS NotePrecisionPanel.swift
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────┐
 * │ PitchLabel                                     [X]  │ ← header (28px)
 * ├──────┬──────────────────────────────────────────────┤
 * │      │ 1.1    1.2    1.3    1.4    2.1   ...       │ ← beat labels
 * │NOTES │ [███] [██]  [████]                          │ ← note blocks
 * │ VEL  │  ╿      ╿     ╿                             │ ← velocity stems
 * │ 127  │  ◉      ◉     ◉                             │   + draggable handles
 * │  95  │                                              │
 * │  64  │                                              │
 * │  32  │                                              │
 * └──────┴──────────────────────────────────────────────┘
 *  60px        scrollable timeline
 */
import React, { memo, useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Canvas, RoundedRect, Rect, Line, vec } from '@shopify/react-native-skia';
import { Text } from '../../../../components/Text';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { useTheme } from '../../../../theme';
import type { ClipNote } from '../../types';

const LABEL_COL_WIDTH = 60;
const BEAT_LABEL_HEIGHT = 16;
const NOTE_AREA_HEIGHT = 36;
const STEP_WIDTH = 24;
const HANDLE_WIDTH = 28;
const HANDLE_HEIGHT = 14;
const STEM_WIDTH = 2;
const BEATS_PER_BAR = 4;
const STEPS_PER_BEAT = 4;

export interface NotePrecisionPanelProps {
  notes: ClipNote[];
  pitchIndex: number;
  pitchLabel: string;
  pitchMidiNumber: number;
  activeLengthInBars: number;
  trackColor: string;
  onClose?: () => void;
  onVelocityChange?: (noteIndex: number, velocity: number) => void;
  onPositionChange?: (noteIndex: number, newPosition: number) => void;
  onDurationChange?: (noteIndex: number, newDuration: number) => void;
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

  // Filter notes at this pitch
  const notesAtPitch = useMemo(
    () => notes.filter(n => n.noteNumber === pitchMidiNumber),
    [notes, pitchMidiNumber]
  );

  // Find global index for each filtered note (for callbacks)
  const noteIndices = useMemo(
    () => notesAtPitch.map(n => notes.indexOf(n)),
    [notesAtPitch, notes]
  );

  const totalSteps = activeLengthInBars * BEATS_PER_BAR * STEPS_PER_BEAT;
  const totalWidth = totalSteps * STEP_WIDTH;
  const totalBeats = activeLengthInBars * BEATS_PER_BAR;

  return (
    <View style={[styles.container, { backgroundColor: colors.mcBlack2 }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.mcBlack3 }]}>
        <Text variant="label" color={colors.mcWhite} style={styles.headerTitle}>
          {pitchLabel}
        </Text>
        <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
          <Icon icon={Icons.close} size={16} color={colors.mcWhite3} />
        </Pressable>
      </View>

      {/* Body: left column + scrollable timeline */}
      <View style={styles.body}>
        {/* Left column */}
        <View style={[styles.leftCol, { width: LABEL_COL_WIDTH }]}>
          <View style={{ height: BEAT_LABEL_HEIGHT }} />
          <View style={styles.leftLabel}>
            <Text variant="extraSmall" color={colors.mcWhite3} center style={styles.labelSmall}>
              NOTES
            </Text>
          </View>
          <View style={styles.velRuler}>
            <Text variant="extraSmall" color={colors.mcWhite3} center style={styles.labelSmall}>
              VEL
            </Text>
            {[127, 95, 64, 32].map(v => (
              <Text key={v} variant="extraSmall" color={colors.mcWhite3} style={styles.rulerTick}>
                {v}
              </Text>
            ))}
          </View>
        </View>

        {/* Scrollable timeline */}
        <ScrollView horizontal showsHorizontalScrollIndicator style={styles.timeline}>
          <View style={{ width: totalWidth }}>
            {/* Beat labels */}
            <View style={styles.beatLabels}>
              {Array.from({ length: totalBeats }, (_, i) => (
                <Text
                  key={i}
                  variant="extraSmall"
                  color={colors.mcWhite3}
                  style={[styles.beatLabel, { left: i * STEPS_PER_BEAT * STEP_WIDTH + 2 }]}
                >
                  {Math.floor(i / BEATS_PER_BAR) + 1}.{(i % BEATS_PER_BAR) + 1}
                </Text>
              ))}
            </View>

            {/* Note blocks + velocity — Skia canvas */}
            <View style={{ flex: 1 }}>
              <Canvas style={StyleSheet.absoluteFill}>
                {/* Beat grid lines */}
                {Array.from({ length: totalSteps + 1 }, (_, step) => {
                  const x = step * STEP_WIDTH;
                  const isBeat = step % STEPS_PER_BEAT === 0;
                  return (
                    <Line
                      key={`g${step}`}
                      p1={vec(x, 0)}
                      p2={vec(x, 999)}
                      color={isBeat ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}
                      strokeWidth={0.5}
                    />
                  );
                })}

                {/* Note blocks */}
                {notesAtPitch.map((note, i) => {
                  const x = (note.position / 0.25) * STEP_WIDTH;
                  const w = Math.max((note.duration / 0.25) * STEP_WIDTH - 1, STEP_WIDTH * 0.5);
                  return (
                    <RoundedRect
                      key={`nb${i}`}
                      x={x}
                      y={2}
                      width={w}
                      height={NOTE_AREA_HEIGHT - 4}
                      r={3}
                      color={trackColor}
                      opacity={0.85}
                    />
                  );
                })}

                {/* Velocity stems + handles */}
                {notesAtPitch.map((note, i) => {
                  const x = (note.position / 0.25) * STEP_WIDTH + HANDLE_WIDTH / 2;
                  const fraction = note.velocity / 127;
                  const velAreaTop = NOTE_AREA_HEIGHT;
                  const velAreaHeight = 200; // will be constrained by flex
                  const stemH = Math.max(STEM_WIDTH, fraction * (velAreaHeight - HANDLE_HEIGHT));
                  const stemTop = velAreaTop + velAreaHeight - stemH;

                  return (
                    <React.Fragment key={`v${i}`}>
                      {/* Stem */}
                      <Rect
                        x={x - STEM_WIDTH / 2}
                        y={stemTop}
                        width={STEM_WIDTH}
                        height={stemH}
                        color={trackColor}
                        opacity={0.4}
                      />
                      {/* Handle pill */}
                      <RoundedRect
                        x={x - HANDLE_WIDTH / 2}
                        y={stemTop - HANDLE_HEIGHT / 2}
                        width={HANDLE_WIDTH}
                        height={HANDLE_HEIGHT}
                        r={HANDLE_HEIGHT / 2}
                        color={trackColor}
                      />
                      {/* Velocity value */}
                    </React.Fragment>
                  );
                })}

                {/* Empty state */}
                {notesAtPitch.length === 0 && (
                  <Rect x={0} y={0} width={totalWidth} height={0} color="transparent" />
                )}
              </Canvas>

              {/* Velocity drag overlay */}
              {notesAtPitch.map((note, i) => {
                const x = (note.position / 0.25) * STEP_WIDTH;
                return (
                  <Pressable
                    key={`vt${i}`}
                    style={{
                      position: 'absolute',
                      left: x,
                      top: NOTE_AREA_HEIGHT,
                      width: HANDLE_WIDTH,
                      bottom: 0,
                    }}
                    onPress={() => {
                      // Cycle velocity: tap to toggle between 127/100/64/32
                      const vel = note.velocity;
                      const next = vel > 100 ? 100 : vel > 64 ? 64 : vel > 32 ? 32 : 127;
                      const globalIdx = noteIndices[i];
                      if (globalIdx !== undefined && globalIdx >= 0) {
                        onVelocityChange?.(globalIdx, next);
                      }
                    }}
                  />
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Empty state message */}
      {notesAtPitch.length === 0 && (
        <View style={styles.emptyState}>
          <Text variant="small" color={colors.mcWhite3}>
            No notes at {pitchLabel}
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 28,
  },
  headerTitle: { flex: 1, fontSize: 13 },
  closeBtn: { padding: 4 },
  body: { flex: 1, flexDirection: 'row' },
  leftCol: { backgroundColor: 'rgba(0,0,0,0.2)' },
  leftLabel: {
    height: NOTE_AREA_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelSmall: { fontSize: 8 },
  velRuler: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rulerTick: { fontSize: 7, textAlign: 'center' },
  timeline: { flex: 1 },
  beatLabels: {
    height: BEAT_LABEL_HEIGHT,
    position: 'relative',
  },
  beatLabel: {
    position: 'absolute',
    fontSize: 8,
    top: 2,
  },
  emptyState: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
