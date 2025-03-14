import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  Switch,
  StatusBar,
} from 'react-native';
import {
  ThemeProvider,
  Text,
  Button,
  Avatar,
  ProgressBar,
  LevelIndicator,
  CircuitCard,
  useTheme,
} from 'react-native-circuit-ui';
import type { Level } from 'react-native-circuit-ui';

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
          backgroundColor: isDark ? colors.black2 : colors.white2,
          shadowColor: isDark ? colors.black : colors.black4,
          borderColor: isDark ? colors.border : colors.mcWhite4,
        },
      ]}
    >
      <Text variant="h4" style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

const ThemeToggle = () => {
  const { colors, setMode, isDark } = useTheme();

  const handleToggle = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  return (
    <View style={styles.themeToggleContainer}>
      <Text variant="label" color={colors.primaryText}>
        Light
      </Text>
      <Switch
        value={isDark}
        onValueChange={handleToggle}
        trackColor={{ false: '#767577', true: colors.primary }}
        thumbColor={isDark ? '#FFFFFF' : '#f4f3f4'}
        ios_backgroundColor={colors.black}
      />
      <Text variant="label" color={colors.primaryText}>
        Dark
      </Text>
    </View>
  );
};

export default function App() {
  return (
    <ThemeProvider initialMode="dark">
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { colors, isDark } = useTheme();
  const [progressValue, setProgressValue] = useState(35);
  const [fastAnimation, setFastAnimation] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<Level>('beginner');
  const [pressCount, setPressCount] = useState(0);

  const gamingLabels = {
    beginner: 'easy',
    intermediate: 'normal',
    advanced: 'hard',
  };

  const setRandomProgress = () => {
    const randomValue = Math.floor(Math.random() * 101); // 0-100
    setProgressValue(randomValue);
  };

  const cycleLevel = () => {
    if (currentLevel === 'beginner') {
      setCurrentLevel('intermediate');
    } else if (currentLevel === 'intermediate') {
      setCurrentLevel('advanced');
    } else {
      setCurrentLevel('beginner');
    }
  };

  const handleCardPress = () => {
    setPressCount(pressCount + 1);
  };

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? colors.black : colors.white },
        ]}
      >
        <ThemeToggle />

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text variant="h2" center style={styles.title}>
            CircuitUI
          </Text>
          <Text variant="body" center style={styles.subtitle}>
            React Native Component Library
          </Text>

          {/* CircuitCard Section */}
          <ComponentSection title="CircuitCard">
            <View style={styles.cardSection}>
              <Text variant="label" style={styles.cardLabel}>
                Default Card
              </Text>
              <CircuitCard>
                <Text variant="h5">Default Card</Text>
                <Text variant="body" style={styles.cardContent}>
                  This is a basic card with default styling. It has shadow,
                  border, and default padding.
                </Text>
              </CircuitCard>

              <Text variant="label" style={styles.cardLabel}>
                SwiftUI Style Card (Vertical)
              </Text>
              <CircuitCard
                title="Introduction to Music Theory"
                description="Learn the fundamentals of music theory including notes, scales, chords, and rhythm. Perfect for beginners who want to understand how music works."
                level="beginner"
                isPreview={true}
                coverImageUrl="https://images.unsplash.com/photo-1507838153414-b4b713384a76?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
              />

              <Text variant="label" style={styles.cardLabel}>
                SwiftUI Style Card (Horizontal)
              </Text>
              <CircuitCard
                variant="horizontal"
                title="Advanced Composition"
                description="Take your composition skills to the next level with advanced techniques and professional workflows."
                level="advanced"
                coverImageUrl="https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
              />

              <Text variant="label" style={styles.cardLabel}>
                Started Circuit Card
              </Text>
              <CircuitCard
                title="Mixing Essentials"
                isStarted={true}
                completedModulesCount={3}
                totalModulesCount={8}
                progress={37}
                trophies="2 Gold, 1 Silver"
                coverImageUrl="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
              />

              <Text variant="label" style={styles.cardLabel}>
                Completed Circuit Card
              </Text>
              <CircuitCard
                title="Beginner's Guide to DAWs"
                isCompleted={true}
                isFavorite={true}
                onFavoritePress={() => console.log('Toggled favorite status')}
                level="beginner"
                coverImageUrl="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
              />

              <Text variant="label" style={styles.cardLabel}>
                Large Size Card
              </Text>
              <CircuitCard
                size="large"
                title="Music Production Masterclass"
                description="A comprehensive guide to music production from start to finish. Learn how to create professional-sounding tracks in your home studio."
                level="intermediate"
                coverImageUrl="https://images.unsplash.com/photo-1619983081563-430f63602796?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
              />

              <Text variant="label" style={styles.cardLabel}>
                Pressable Card
              </Text>
              <CircuitCard
                pressable
                onPress={handleCardPress}
                title="Interactive Lessons"
                description={`This card is pressable. Press count: ${pressCount}`}
                level="beginner"
                coverImageUrl="https://images.unsplash.com/photo-1513829596324-4bb2800c5efb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
              />

              <Text variant="label" style={styles.cardLabel}>
                No Shadow
              </Text>
              <CircuitCard showShadow={false}>
                <Text variant="h5">No Shadow Card</Text>
                <Text variant="body" style={styles.cardContent}>
                  This card has no shadow, but still has a border.
                </Text>
              </CircuitCard>

              <Text variant="label" style={styles.cardLabel}>
                No Border
              </Text>
              <CircuitCard showBorder={false}>
                <Text variant="h5">No Border Card</Text>
                <Text variant="body" style={styles.cardContent}>
                  This card has no border, but still has a shadow.
                </Text>
              </CircuitCard>

              <Text variant="label" style={styles.cardLabel}>
                Custom Border Radius
              </Text>
              <CircuitCard borderRadius={20}>
                <Text variant="h5">Rounded Card</Text>
                <Text variant="body" style={styles.cardContent}>
                  This card has a larger border radius (20).
                </Text>
              </CircuitCard>

              <Text variant="label" style={styles.cardLabel}>
                Custom Colors
              </Text>
              <CircuitCard
                backgroundColor={colors.mcBlue5}
                borderColor={colors.mcBlue3}
              >
                <Text variant="h5" color={colors.mcWhite1}>
                  Custom Colors
                </Text>
                <Text
                  variant="body"
                  color={colors.mcWhite2}
                  style={styles.cardContent}
                >
                  This card has custom background and border colors.
                </Text>
              </CircuitCard>

              <Text variant="label" style={styles.cardLabel}>
                Card with Components
              </Text>
              <CircuitCard>
                <Text variant="h5" style={styles.cardTitle}>
                  Profile Card
                </Text>
                <View style={styles.cardRow}>
                  <Avatar size={60} imageUrl="https://i.pravatar.cc/300" />
                  <View style={styles.cardContent}>
                    <Text variant="labelBold">John Doe</Text>
                    <Text variant="small">Software Developer</Text>
                    <LevelIndicator
                      level="intermediate"
                      tintColor={colors.mcBlue1}
                      style={styles.cardLevel}
                    />
                  </View>
                </View>
                <ProgressBar
                  value={75}
                  tintColor={colors.mcBlue1}
                  style={styles.cardProgress}
                />
                <Text variant="small" center>
                  Profile Completion: 75%
                </Text>
              </CircuitCard>

              <Text variant="label" style={styles.cardLabel}>
                Small Card (Horizontal)
              </Text>
              <CircuitCard
                variant="horizontal"
                size="small"
                title="Drum Programming"
                description="Learn the basics of drum programming and rhythm creation."
                level="beginner"
                coverImageUrl="https://images.unsplash.com/photo-1543443258-92b04ad5ec6b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
              />

              <Text variant="label" style={styles.cardLabel}>
                Medium Card (Horizontal)
              </Text>
              <CircuitCard
                variant="horizontal"
                size="medium"
                title="Synthesizer Basics"
                description="Understand the fundamentals of synthesis and sound design."
                level="intermediate"
                coverImageUrl="https://images.unsplash.com/photo-1598295893369-1918ffaf89a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
              />

              <Text variant="label" style={styles.cardLabel}>
                Small Card (Vertical)
              </Text>
              <CircuitCard
                variant="vertical"
                size="small"
                title="Vocal Processing"
                description="Learn techniques for processing and enhancing vocal recordings."
                level="intermediate"
                coverImageUrl="https://images.unsplash.com/photo-1516280440614-37939bbacd81?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
              />
            </View>
          </ComponentSection>

          {/* LevelIndicator Section */}
          <ComponentSection title="LevelIndicator (Difficulty)">
            <View style={styles.levelSection}>
              <Text variant="label" style={styles.levelLabel}>
                Default Labels
              </Text>

              <View style={styles.levelRow}>
                <LevelIndicator
                  level={currentLevel}
                  tintColor={colors.mcOrange1}
                />
              </View>

              <Text variant="label" style={styles.levelLabel}>
                Custom Labels (Gaming Context)
              </Text>

              <View style={styles.levelRow}>
                <LevelIndicator
                  level={currentLevel}
                  tintColor={colors.mcOrange1}
                  levelLabels={gamingLabels}
                />
              </View>

              <Text variant="label" style={styles.levelLabel}>
                All Levels with Different Colors
              </Text>

              <View style={styles.levelRow}>
                <View style={styles.levelItem}>
                  <LevelIndicator
                    level="beginner"
                    tintColor={colors.mcGreen1}
                  />
                  <Text variant="small" center style={styles.levelItemLabel}>
                    Default
                  </Text>
                </View>

                <View style={styles.levelItem}>
                  <LevelIndicator
                    level="beginner"
                    tintColor={colors.mcGreen1}
                    label="Novice"
                  />
                  <Text variant="small" center style={styles.levelItemLabel}>
                    Custom Label
                  </Text>
                </View>

                <View style={styles.levelItem}>
                  <LevelIndicator
                    level="beginner"
                    tintColor={colors.mcGreen1}
                    levelLabels={gamingLabels}
                  />
                  <Text variant="small" center style={styles.levelItemLabel}>
                    Gaming Labels
                  </Text>
                </View>
              </View>

              <Text variant="label" style={styles.levelLabel}>
                Intermediate Level
              </Text>

              <View style={styles.levelRow}>
                <View style={styles.levelItem}>
                  <LevelIndicator
                    level="intermediate"
                    tintColor={colors.mcBlue1}
                  />
                  <Text variant="small" center style={styles.levelItemLabel}>
                    Default
                  </Text>
                </View>

                <View style={styles.levelItem}>
                  <LevelIndicator
                    level="intermediate"
                    tintColor={colors.mcBlue1}
                    label="Medium"
                  />
                  <Text variant="small" center style={styles.levelItemLabel}>
                    Custom Label
                  </Text>
                </View>

                <View style={styles.levelItem}>
                  <LevelIndicator
                    level="intermediate"
                    tintColor={colors.mcBlue1}
                    levelLabels={gamingLabels}
                  />
                  <Text variant="small" center style={styles.levelItemLabel}>
                    Gaming Labels
                  </Text>
                </View>
              </View>

              <Text variant="label" style={styles.levelLabel}>
                Advanced Level
              </Text>

              <View style={styles.levelRow}>
                <View style={styles.levelItem}>
                  <LevelIndicator level="advanced" tintColor={colors.mcPink1} />
                  <Text variant="small" center style={styles.levelItemLabel}>
                    Default
                  </Text>
                </View>

                <View style={styles.levelItem}>
                  <LevelIndicator
                    level="advanced"
                    tintColor={colors.mcPink1}
                    label="Expert"
                  />
                  <Text variant="small" center style={styles.levelItemLabel}>
                    Custom Label
                  </Text>
                </View>

                <View style={styles.levelItem}>
                  <LevelIndicator
                    level="advanced"
                    tintColor={colors.mcPink1}
                    levelLabels={gamingLabels}
                  />
                  <Text variant="small" center style={styles.levelItemLabel}>
                    Gaming Labels
                  </Text>
                </View>
              </View>

              <Text variant="label" style={styles.levelLabel}>
                Custom Colors
              </Text>

              <View style={styles.levelRow}>
                <LevelIndicator
                  level="advanced"
                  tintColor={colors.mcPurple1}
                  textColor={colors.mcPurple1}
                  backgroundColor={isDark ? colors.mcBlack3 : colors.mcWhite3}
                  label="Expert Mode"
                />
              </View>

              <View style={styles.levelControls}>
                <Button
                  label="Change Level"
                  variant="outline"
                  onPress={cycleLevel}
                />
              </View>
            </View>
          </ComponentSection>

          {/* ProgressBar Section */}
          <ComponentSection title="ProgressBar">
            <View style={styles.progressSection}>
              <Text variant="label" style={styles.progressLabel}>
                Animated Progress ({progressValue}%)
              </Text>
              <ProgressBar
                value={progressValue}
                animationDuration={fastAnimation ? 100 : 300}
              />
            </View>

            <View style={styles.progressSection}>
              <Text variant="label" style={styles.progressLabel}>
                Non-Animated Progress ({progressValue}%)
              </Text>
              <ProgressBar value={progressValue} animated={false} />
            </View>

            <View style={styles.progressSection}>
              <Text variant="label" style={styles.progressLabel}>
                Custom Height (8px) & Fast Animation
              </Text>
              <ProgressBar
                value={progressValue}
                height={8}
                animationDuration={100}
              />
            </View>

            <View style={styles.progressSection}>
              <Text variant="label" style={styles.progressLabel}>
                Custom Color (Orange)
              </Text>
              <ProgressBar value={progressValue} tintColor={colors.orange} />
            </View>

            <View style={styles.progressSection}>
              <Text variant="label" style={styles.progressLabel}>
                Custom Color (Green) & Slow Animation
              </Text>
              <ProgressBar
                value={progressValue}
                tintColor={colors.green}
                animationDuration={1000}
              />
            </View>

            <View style={styles.progressSection}>
              <Text variant="label" style={styles.progressLabel}>
                100% Complete
              </Text>
              <ProgressBar value={100} />
            </View>

            <View style={styles.progressSection}>
              <Text variant="label" style={styles.progressLabel}>
                0% Complete
              </Text>
              <ProgressBar value={0} />
            </View>

            <View style={styles.progressControls}>
              <Button
                label="-10%"
                variant="outline"
                onPress={() =>
                  setProgressValue(Math.max(0, progressValue - 10))
                }
              />
              <Button
                label="+10%"
                variant="outline"
                onPress={() =>
                  setProgressValue(Math.min(100, progressValue + 10))
                }
              />
              <Button
                label="Random"
                variant="outline"
                onPress={setRandomProgress}
              />
            </View>

            <View style={styles.progressToggle}>
              <Text variant="label">Fast Animation</Text>
              <Switch
                value={fastAnimation}
                onValueChange={setFastAnimation}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={fastAnimation ? '#FFFFFF' : '#f4f3f4'}
                ios_backgroundColor={colors.black}
              />
            </View>
          </ComponentSection>

          {/* Avatar Section */}
          <ComponentSection title="Avatar">
            <View style={styles.avatarRow}>
              <View style={styles.avatarItem}>
                <Avatar size={80} />
                <Text variant="small" center style={styles.avatarLabel}>
                  Default
                </Text>
              </View>

              <View style={styles.avatarItem}>
                <Avatar size={80} imageUrl="https://i.pravatar.cc/300" />
                <Text variant="small" center style={styles.avatarLabel}>
                  With Image
                </Text>
              </View>

              <View style={styles.avatarItem}>
                <Avatar size={60} imageUrl="https://i.pravatar.cc/300?img=2" />
                <Text variant="small" center style={styles.avatarLabel}>
                  Size 60
                </Text>
              </View>

              <View style={styles.avatarItem}>
                <Avatar size={40} imageUrl="https://i.pravatar.cc/300?img=3" />
                <Text variant="small" center style={styles.avatarLabel}>
                  Size 40
                </Text>
              </View>
            </View>

            <View style={styles.avatarRow}>
              <View style={styles.avatarItem}>
                <Avatar
                  size={80}
                  imageUrl="https://i.pravatar.cc/300?img=4"
                  showShadow={false}
                />
                <Text variant="small" center style={styles.avatarLabel}>
                  No Shadow
                </Text>
              </View>

              <View style={styles.avatarItem}>
                <Avatar size={80} imageUrl="https://invalid-url.example" />
                <Text variant="small" center style={styles.avatarLabel}>
                  Invalid URL
                </Text>
              </View>
            </View>
          </ComponentSection>

          {/* Typography Section */}
          <ComponentSection title="Typography">
            <Text variant="h1">Heading 1</Text>
            <Text variant="h2">Heading 2</Text>
            <Text variant="h3">Heading 3</Text>
            <Text variant="h4">Heading 4</Text>
            <Text variant="h5">Heading 5</Text>
            <Text variant="body">
              Body text for regular paragraphs and content
            </Text>
            <Text variant="label">Label text for form elements</Text>
            <Text variant="labelBold">Bold label for emphasis</Text>
            <Text variant="small">Small text for captions and details</Text>
            <Text variant="quote">Quote text for testimonials</Text>
          </ComponentSection>

          {/* Text Styles Section */}
          <ComponentSection title="Text Styles">
            <Text bold>Bold text</Text>
            <Text center>Centered text</Text>
            <Text right>Right-aligned text</Text>
            <Text uppercase>Uppercase text</Text>
            <Text color={colors.secondary}>Custom color text</Text>
          </ComponentSection>

          {/* Buttons Section */}
          <ComponentSection title="Button Variants">
            <View style={styles.buttonRow}>
              <Button label="Primary" variant="primary" />
            </View>
            <View style={styles.buttonRow}>
              <Button label="Secondary" variant="secondary" />
            </View>
            <View style={styles.buttonRow}>
              <Button label="Normal" variant="normal" />
            </View>
            <View style={styles.buttonRow}>
              <Button label="Outline" variant="outline" />
            </View>
            <View style={styles.buttonRow}>
              <Button label="Solid" variant="solid" />
            </View>
          </ComponentSection>

          {/* Button Colors */}
          <ComponentSection title="Button Colors">
            <View style={styles.buttonRow}>
              <Button label="Orange" variant="primary" color={colors.orange} />
            </View>
            <View style={styles.buttonRow}>
              <Button label="Blue" variant="primary" color={colors.blue} />
            </View>
            <View style={styles.buttonRow}>
              <Button label="Green" variant="primary" color={colors.green} />
            </View>
            <View style={styles.buttonRow}>
              <Button label="Pink" variant="primary" color={colors.pink} />
            </View>
          </ComponentSection>

          {/* Button Sizes */}
          <ComponentSection title="Button Sizes">
            <View style={styles.buttonRow}>
              <Button label="Medium" size="medium" />
            </View>
            <View style={styles.buttonRow}>
              <Button label="Large" size="large" />
            </View>
          </ComponentSection>

          {/* Button States */}
          <ComponentSection title="Button States">
            <View style={styles.buttonRow}>
              <Button label="Disabled" disabled />
            </View>
            <View style={styles.buttonRow}>
              <Button label="Loading" loading />
            </View>
            <View style={styles.buttonRow}>
              <Button label="Full Width" fullWidth />
            </View>
            <View style={styles.buttonRow}>
              <Button label="Rounded" rounded />
            </View>
          </ComponentSection>

          {/* Secondary Button Styles */}
          <ComponentSection title="Secondary Button Styles">
            <View style={styles.buttonRow}>
              <Button
                label="Orange"
                variant="secondary"
                color={colors.orange}
              />
            </View>
            <View style={styles.buttonRow}>
              <Button label="Blue" variant="secondary" color={colors.blue} />
            </View>
            <View style={styles.buttonRow}>
              <Button label="Green" variant="secondary" color={colors.green} />
            </View>
          </ComponentSection>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  title: {
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
    borderRadius: 8,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  sectionTitle: {
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  sectionContent: {
    marginTop: 12,
    gap: 12,
  },
  buttonRow: {
    marginBottom: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  avatarItem: {
    alignItems: 'center',
    margin: 8,
  },
  avatarLabel: {
    marginTop: 8,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabel: {
    marginBottom: 8,
  },
  progressControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  progressToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  levelSection: {
    marginBottom: 16,
  },
  levelLabel: {
    marginBottom: 12,
  },
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 16,
  },
  levelItem: {
    alignItems: 'center',
  },
  levelItemLabel: {
    marginTop: 8,
  },
  levelControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  cardSection: {
    gap: 20,
  },
  cardLabel: {
    marginBottom: 8,
  },
  cardContent: {
    marginTop: 8,
  },
  cardButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  cardTitle: {
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardLevel: {
    marginTop: 8,
  },
  cardProgress: {
    marginVertical: 16,
  },
});
