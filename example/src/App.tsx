/**
 * CircuitUI Showcase — Example App
 *
 * Demonstrates all components with dark theme (matching Midicircuit brand).
 */
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  Switch,
  StatusBar,
  Pressable,
} from 'react-native';
import PlaygroundShowcase from './PlaygroundShowcase';
import FeaturesShowcase from './FeaturesShowcase';
import {
  ThemeProvider,
  Text,
  Button,
  Avatar,
  ProgressBar,
  LevelIndicator,
  CircuitCard,
  LearningPathCard,
  CircularProgress,
  Banner,
  SegmentedProgressBar,
  GradientCover,
  Input,
  ToolbarButton,
  ScoreIndicator,
  CircularLoadingView,
  PlaceholderView,
  HintBubble,
  useTheme,
} from 'react-native-circuit-ui';
import type { Level, LearningPathDetails } from 'react-native-circuit-ui';

// ─── Section Wrapper ────────────────────────────────────────────────────────

const ComponentSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: isDark ? colors.mcBlack3 : colors.mcWhite,
          borderColor: isDark ? colors.mcBlack4 : colors.mcWhite4,
        },
      ]}
    >
      <Text variant="h5" style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

// ─── Theme Toggle ───────────────────────────────────────────────────────────

const ThemeToggle = () => {
  const { colors, setMode, isDark } = useTheme();
  return (
    <View style={styles.themeToggle}>
      <Text variant="label" color={colors.mcWhite}>
        Light
      </Text>
      <Switch
        value={isDark}
        onValueChange={() => setMode(isDark ? 'light' : 'dark')}
        trackColor={{ false: '#767577', true: colors.mcOrange }}
        thumbColor="#fff"
        ios_backgroundColor={colors.mcBlack}
      />
      <Text variant="label" color={colors.mcWhite}>
        Dark
      </Text>
    </View>
  );
};

// ─── App Root ───────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<'components' | 'playground' | 'features'>('components');

  if (screen === 'playground') {
    return (
      <View style={{ flex: 1 }}>
        <PlaygroundShowcase />
        <View style={navStyles.navBar}>
          <Pressable onPress={() => setScreen('components')} style={navStyles.navBtn}>
            <Text style={navStyles.navBtnText}>← UI Kit</Text>
          </Pressable>
          <Pressable onPress={() => setScreen('features')} style={navStyles.navBtn}>
            <Text style={navStyles.navBtnText}>Features →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (screen === 'features') {
    return (
      <View style={{ flex: 1 }}>
        <FeaturesShowcase />
        <View style={navStyles.navBar}>
          <Pressable onPress={() => setScreen('playground')} style={navStyles.navBtn}>
            <Text style={navStyles.navBtnText}>← DAW</Text>
          </Pressable>
          <Pressable onPress={() => setScreen('components')} style={navStyles.navBtn}>
            <Text style={navStyles.navBtnText}>UI Kit →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ThemeProvider initialMode="dark">
      <View style={{ flex: 1 }}>
        <AppContent />
        <View style={navStyles.navBar}>
          <Pressable onPress={() => setScreen('playground')} style={navStyles.navBtn}>
            <Text style={navStyles.navBtnText}>🎹 DAW</Text>
          </Pressable>
          <Pressable onPress={() => setScreen('features')} style={navStyles.navBtn}>
            <Text style={navStyles.navBtnText}>📱 Features</Text>
          </Pressable>
        </View>
      </View>
    </ThemeProvider>
  );
}

const navStyles = StyleSheet.create({
  navBar: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navBtn: {
    backgroundColor: '#FF5C24',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  navBtnText: {
    color: '#F7F7F7',
    fontWeight: '600',
    fontSize: 13,
  },
});

function AppContent() {
  const { colors, isDark } = useTheme();
  const [progressValue, setProgressValue] = useState(35);
  const [currentLevel, setCurrentLevel] = useState<Level>('beginner');
  const [pressCount, setPressCount] = useState(0);
  const [inputValue, setInputValue] = useState('');

  const learningPaths: LearningPathDetails[] = [
    { id: '1', title: 'Foundations of Music' },
    { id: '2', title: 'Music Production' },
    { id: '3', title: 'Sound Design' },
    { id: '4', title: 'Mixing & Mastering' },
  ];

  const cycleLevel = () => {
    const levels: Level[] = ['beginner', 'intermediate', 'advanced'];
    const idx = levels.indexOf(currentLevel);
    setCurrentLevel(levels[(idx + 1) % 3]!);
  };

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? colors.mcBlack2 : colors.mcWhite },
        ]}
      >
        <ThemeToggle />

        <ScrollView contentContainerStyle={styles.scroll}>
          <Text variant="h2" center style={styles.title}>
            CircuitUI
          </Text>
          <Text variant="body" center style={styles.subtitle}>
            React Native Component Library
          </Text>

          {/* ── Typography ──────────────────────────────────────── */}
          <ComponentSection title="Typography">
            <Text variant="h1">H1 Heading</Text>
            <Text variant="h2">H2 Heading</Text>
            <Text variant="h3">H3 Heading</Text>
            <Text variant="h4">H4 Heading</Text>
            <Text variant="h5">H5 Heading</Text>
            <Text variant="body">Body text for content</Text>
            <Text variant="label">Label text</Text>
            <Text variant="small">Small / caption text</Text>
            <Text variant="quote">Quote text</Text>
          </ComponentSection>

          {/* ── Buttons ─────────────────────────────────────────── */}
          <ComponentSection title="Buttons">
            <Button label="Primary" variant="primary" />
            <Button label="Secondary" variant="secondary" />
            <Button label="Normal" variant="normal" />
            <Button label="Outline" variant="outline" />
            <Button label="Solid" variant="solid" />
            <Button label="Green Primary" variant="primary" color={colors.mcGreen} />
            <Button label="Large" size="large" />
            <Button label="Disabled" disabled />
            <Button label="Loading" loading />
            <Button label="Full Width" fullWidth />
            <Button label="Rounded" rounded />
          </ComponentSection>

          {/* ── Input ───────────────────────────────────────────── */}
          <ComponentSection title="Input">
            <Input
              label="Username"
              placeholder="Enter username..."
              value={inputValue}
              onChangeText={setInputValue}
            />
            <Input
              label="With Error"
              placeholder="Email"
              value=""
              error="Invalid email address"
            />
            <Input
              label="Disabled"
              placeholder="Cannot edit"
              value="Locked"
              disabled
            />
          </ComponentSection>

          {/* ── ToolbarButton ───────────────────────────────────── */}
          <ComponentSection title="ToolbarButton">
            <View style={styles.row}>
              <ToolbarButton type="back" onPress={() => {}} />
              <ToolbarButton type="toggleSidebar" onPress={() => {}} />
            </View>
          </ComponentSection>

          {/* ── Avatar ──────────────────────────────────────────── */}
          <ComponentSection title="Avatar">
            <View style={styles.row}>
              <Avatar size={80} />
              <Avatar size={80} imageUrl="https://i.pravatar.cc/300" />
              <Avatar size={60} imageUrl="https://i.pravatar.cc/300?img=2" />
              <Avatar size={40} imageUrl="https://i.pravatar.cc/300?img=3" />
            </View>
          </ComponentSection>

          {/* ── ProgressBar ─────────────────────────────────────── */}
          <ComponentSection title="ProgressBar">
            <Text variant="small">Value: {progressValue}%</Text>
            <ProgressBar value={progressValue} />
            <ProgressBar value={progressValue} tintColor={colors.mcOrange} height={8} />
            <ProgressBar value={progressValue} tintColor={colors.mcGreen} />
            <View style={styles.row}>
              <Button
                label="-10"
                variant="outline"
                onPress={() => setProgressValue(Math.max(0, progressValue - 10))}
              />
              <Button
                label="+10"
                variant="outline"
                onPress={() => setProgressValue(Math.min(100, progressValue + 10))}
              />
              <Button
                label="Random"
                variant="outline"
                onPress={() => setProgressValue(Math.floor(Math.random() * 101))}
              />
            </View>
          </ComponentSection>

          {/* ── CircularProgress ────────────────────────────────── */}
          <ComponentSection title="CircularProgress">
            <View style={styles.row}>
              <CircularProgress progress={0.35} showPercentage />
              <CircularProgress progress={0.7} size="large" showPercentage />
              <CircularProgress progress={1.0} showCheckMark />
            </View>
          </ComponentSection>

          {/* ── SegmentedProgressBar ────────────────────────────── */}
          <ComponentSection title="SegmentedProgressBar">
            <SegmentedProgressBar segmentsCount={4} completedSegments={2} />
            <SegmentedProgressBar segmentsCount={6} completedSegments={4} />
            <SegmentedProgressBar segmentsCount={3} completedSegments={3} />
          </ComponentSection>

          {/* ── LevelIndicator ──────────────────────────────────── */}
          <ComponentSection title="LevelIndicator">
            <LevelIndicator level={currentLevel} tintColor={colors.mcOrange} />
            <LevelIndicator
              level="beginner"
              tintColor={colors.mcGreen}
            />
            <LevelIndicator
              level="intermediate"
              tintColor={colors.mcBlue}
            />
            <LevelIndicator
              level="advanced"
              tintColor={colors.mcPink}
            />
            <LevelIndicator
              level={currentLevel}
              tintColor={colors.mcPurple}
              levelLabels={{ beginner: 'Easy', intermediate: 'Normal', advanced: 'Hard' }}
            />
            <Button label="Cycle Level" variant="outline" onPress={cycleLevel} />
          </ComponentSection>

          {/* ── GradientCover ───────────────────────────────────── */}
          <ComponentSection title="GradientCover">
            <View style={styles.row}>
              <GradientCover id="550e8400-e29b-41d4-a716-446655440000" width={80} height={80} />
              <GradientCover id="6ba7b810-9dad-11d1-80b4-00c04fd430c8" width={80} height={80} />
              <GradientCover id="f47ac10b-58cc-4372-a567-0e02b2c3d479" width={80} height={80} />
            </View>
          </ComponentSection>

          {/* ── Banner ──────────────────────────────────────────── */}
          <ComponentSection title="Banner">
            <Banner
              imageUrl="https://images.unsplash.com/photo-1584903354420-f2eea627b2c1?w=800"
              height={200}
            />
          </ComponentSection>

          {/* ── LearningPathCard ────────────────────────────────── */}
          <ComponentSection title="LearningPathCard">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {learningPaths.map((path) => (
                <LearningPathCard key={path.id} learningPath={path} />
              ))}
            </ScrollView>
          </ComponentSection>

          {/* ── CircuitCard ─────────────────────────────────────── */}
          <ComponentSection title="CircuitCard">
            <CircuitCard
              title="Introduction to Music Theory"
              description="Learn the fundamentals of music theory including notes, scales, chords, and rhythm."
              level="beginner"
              coverImageUrl="https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800"
            />

            <CircuitCard
              variant="horizontal"
              title="Advanced Composition"
              description="Take your composition skills to the next level."
              level="advanced"
              coverImageUrl="https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800"
            />

            <CircuitCard
              title="Mixing Essentials"
              isStarted
              completedModulesCount={3}
              totalModulesCount={8}
              progress={37}
              trophies="2 Gold, 1 Silver"
              coverImageUrl="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800"
            />

            <CircuitCard
              pressable
              onPress={() => setPressCount(pressCount + 1)}
              title="Interactive Card"
              description={`Pressable. Count: ${pressCount}`}
              level="beginner"
              coverImageUrl="https://images.unsplash.com/photo-1513829596324-4bb2800c5efb?w=800"
            />
          </ComponentSection>

          {/* ── ScoreIndicator ────────────────────────────── */}
          <ComponentSection title="ScoreIndicator">
            <View style={styles.row}>
              <ScoreIndicator score={0} max={3} />
              <ScoreIndicator score={1} max={3} />
              <ScoreIndicator score={2} max={3} />
              <ScoreIndicator score={3} max={3} />
            </View>
            <View style={styles.row}>
              <ScoreIndicator score={3} max={5} size={16} />
              <ScoreIndicator score={5} max={5} color={colors.mcOrange} />
            </View>
          </ComponentSection>

          {/* ── CircularLoadingView ─────────────────────────── */}
          <ComponentSection title="CircularLoadingView">
            <View style={styles.row}>
              <CircularLoadingView size={60} />
              <CircularLoadingView size={100} color={colors.mcOrange} />
            </View>
          </ComponentSection>

          {/* ── HintBubble ─────────────────────────────────── */}
          <ComponentSection title="HintBubble">
            <View style={styles.row}>
              <HintBubble />
            </View>
          </ComponentSection>

          {/* ── PlaceholderView ─────────────────────────────── */}
          <ComponentSection title="PlaceholderView">
            <PlaceholderView
              type={{ kind: 'empty', title: 'No results', subtitle: 'Try a different search term' }}
            />
            <PlaceholderView
              type={{ kind: 'network' }}
              buttons={[{ title: 'Retry', onPress: () => {} }]}
            />
          </ComponentSection>

          <View style={styles.footer} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  themeToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  title: { marginTop: 16, marginBottom: 4 },
  subtitle: { marginBottom: 24, opacity: 0.7 },
  section: {
    marginBottom: 20,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(247,247,247,0.1)',
    paddingBottom: 8,
  },
  sectionContent: { gap: 12 },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  horizontalScroll: { gap: 16, paddingBottom: 8 },
  footer: { height: 40 },
});
