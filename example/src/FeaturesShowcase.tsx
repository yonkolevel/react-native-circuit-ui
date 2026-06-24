/**
 * Features Showcase — renders all feature screens with mock data.
 */
import { useState } from 'react';
import { SafeAreaView, ScrollView, View, StyleSheet } from 'react-native';
import {
  ThemeProvider,
  Text,
  useTheme,
  CircuitCard,
  LearningPathCard,
} from 'react-native-circuit-ui';

// Feature imports
import { DashboardTabBar } from '../../packages/ui/src/features/dashboard';
import type { DashboardTab } from '../../packages/ui/src/features/dashboard';
import { WelcomeView } from '../../packages/ui/src/features/welcome';
import { ProfileCard, SignInView } from '../../packages/ui/src/features/account';
import { FeaturedCard } from '../../packages/ui/src/features/discover';
import { TrophiesView } from '../../packages/ui/src/features/trophies';
import type { Trophy } from '../../packages/ui/src/features/trophies';
import { MyCircuitsView } from '../../packages/ui/src/features/circuits';
import type { MyCircuitsState } from '../../packages/ui/src/features/circuits';

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.section,
        { backgroundColor: colors.mcBlack3, borderColor: colors.mcBlack4 },
      ]}
    >
      <Text variant="h5" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
};

// ── Mock Data ───────────────────────────────────────────────────────────────

const mockTrophies: Trophy[] = [
  {
    id: '1',
    title: 'First Beat',
    description: 'Create your first beat',
    achieved: true,
    imageUrl: undefined,
  },
  {
    id: '2',
    title: 'Melody Maker',
    description: 'Complete melody lesson',
    achieved: true,
    imageUrl: undefined,
  },
  {
    id: '3',
    title: 'Chord Master',
    description: 'Learn all major chords',
    achieved: false,
    imageUrl: undefined,
  },
  {
    id: '4',
    title: 'Sound Designer',
    description: 'Create a custom sound',
    achieved: false,
    imageUrl: undefined,
  },
  {
    id: '5',
    title: 'Mix Engineer',
    description: 'Complete mixing lesson',
    achieved: true,
    imageUrl: undefined,
  },
  {
    id: '6',
    title: 'Producer',
    description: 'Finish a full track',
    achieved: false,
    imageUrl: undefined,
  },
];

const mockCircuitsState: MyCircuitsState = {
  status: 'loaded',
  recommended: {
    id: 'c1',
    title: 'My First Beat',
    description: 'Learn to make beats',
    coverImageUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
    level: 'beginner',
    isPreview: false,
    progress: 45,
    isFavorite: true,
    isCompleted: false,
    lessonsCount: 5,
    completedLessonsCount: 2,
  },
  inProgress: [
    {
      id: 'c2',
      title: 'Music Theory',
      description: 'Fundamentals',
      coverImageUrl:
        'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400',
      level: 'beginner',
      isPreview: false,
      progress: 20,
      isFavorite: false,
      isCompleted: false,
      lessonsCount: 8,
      completedLessonsCount: 1,
    },
    {
      id: 'c3',
      title: 'Sound Design',
      description: 'Synthesis basics',
      coverImageUrl:
        'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400',
      level: 'intermediate',
      isPreview: false,
      progress: 60,
      isFavorite: true,
      isCompleted: false,
      lessonsCount: 6,
      completedLessonsCount: 3,
    },
  ],
  learningPaths: [
    { id: 'lp1', title: 'Foundations of Music', circuits: [] },
    { id: 'lp2', title: 'Production Masterclass', circuits: [] },
  ],
};

function ShowcaseContent() {
  const { colors } = useTheme();
  const [dashTab, setDashTab] = useState<DashboardTab>('myCircuits');

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.mcBlack2 }]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text variant="h3" center style={styles.title}>
          📱 Features
        </Text>
        <Text
          variant="body"
          center
          color={colors.mcWhite3}
          style={styles.subtitle}
        >
          All App Feature Screens
        </Text>

        {/* Dashboard TabBar */}
        <Section title="Dashboard TabBar">
          <DashboardTabBar
            tabs={['myCircuits', 'discover', 'profile', 'playgrounds']}
            selectedTab={dashTab}
            onTabPress={setDashTab}
          />
          <Text
            variant="small"
            center
            color={colors.mcWhite3}
            style={styles.marginTop}
          >
            Active: {dashTab}
          </Text>
        </Section>

        {/* Welcome */}
        <Section title="Welcome Screen">
          <View style={styles.featureHeight}>
            <WelcomeView onGetStarted={() => {}} onSignIn={() => {}} />
          </View>
        </Section>

        {/* Sign In */}
        <Section title="Sign In">
          <SignInView onSignIn={() => {}} onSignInWithApple={() => {}} />
        </Section>

        {/* Profile Card */}
        <Section title="Profile Card">
          <ProfileCard
            profile={{
              id: '1',
              name: 'Ricardo Abreu',
              email: 'ricardo@midicircuit.com',
              pictureUrl: 'https://i.pravatar.cc/300',
            }}
            onEditProfile={() => {}}
            onLogout={() => {}}
          />
        </Section>

        {/* Featured Card (Discover) */}
        <Section title="Featured Card">
          <FeaturedCard
            title="Learn Music Production"
            description="Start your journey into music creation"
            imageUrl="https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800"
            onPress={() => {}}
          />
        </Section>

        {/* Trophies */}
        <Section title="Trophy Gallery">
          <TrophiesView trophies={mockTrophies} onSelect={() => {}} />
        </Section>

        {/* My Circuits */}
        <Section title="My Circuits">
          <MyCircuitsView
            state={mockCircuitsState}
            renderCircuitCard={(circuit) => (
              <CircuitCard
                key={circuit.id}
                title={circuit.title}
                description={circuit.description}
                level={circuit.level}
                isStarted={circuit.progress > 0}
                progress={circuit.progress}
                completedModulesCount={circuit.completedLessonsCount}
                totalModulesCount={circuit.lessonsCount}
                coverImageUrl={circuit.coverImageUrl}
                variant="horizontal"
                size="small"
              />
            )}
            renderLearningPathCard={(path) => (
              <LearningPathCard
                key={path.id}
                learningPath={{ id: path.id, title: path.title }}
                size="small"
              />
            )}
          />
        </Section>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default function FeaturesShowcase() {
  return (
    <ThemeProvider initialMode="dark">
      <ShowcaseContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  title: { marginTop: 16, marginBottom: 4 },
  subtitle: { marginBottom: 24 },
  section: { marginBottom: 16, borderRadius: 8, padding: 12, borderWidth: 1 },
  sectionTitle: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(247,247,247,0.1)',
    paddingBottom: 8,
  },
  marginTop: { marginTop: 8 },
  featureHeight: { height: 400 },
  footer: { height: 40 },
});
