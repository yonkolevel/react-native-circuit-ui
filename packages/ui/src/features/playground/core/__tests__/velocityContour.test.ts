import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import fixtureJson from './fixtures/velocity-contour-v1.json';
import {
  applyContour,
  sampleContour,
  type VelocityContour,
  type VelocityContourMode,
} from '../velocityContour';

interface PointFixture {
  beat: number;
  velocity: number;
}

interface ContourFixture {
  startBeat: number;
  endBeat: number;
  variant:
    | { type: 'curve'; from: number; to: number; bend: number }
    | { type: 'polyline'; points: PointFixture[] };
}

interface NoteFixture {
  id: number;
  position: number;
  velocity: number;
}

interface ContractFixture {
  version: number;
  sampleCases: Array<{
    name: string;
    contour: ContourFixture;
    beats: number[];
    expected: number[];
  }>;
  applyCases: Array<{
    name: string;
    mode: VelocityContourMode;
    contour: ContourFixture;
    notes: NoteFixture[];
    expectedVelocities: number[];
  }>;
}

const fixture = fixtureJson as ContractFixture;

const makeContour = (value: ContourFixture): VelocityContour => value;

describe('VelocityContour shared contract', () => {
  it('uses contract version 1', () => {
    expect(fixture.version).toBe(1);
  });

  it('keeps the standalone fixture byte-aligned with MidicircuitKit when both repos exist', () => {
    const canonicalPath = resolve(
      __dirname,
      '../../../../../../../..',
      'MidicircuitKit/Tests/CorePlaygroundTests/Resources/VelocityContour/velocity-contour-v1.json'
    );

    if (!existsSync(canonicalPath)) return;

    const mirrorPath = resolve(__dirname, 'fixtures/velocity-contour-v1.json');
    expect(readFileSync(mirrorPath, 'utf8')).toBe(
      readFileSync(canonicalPath, 'utf8')
    );
  });

  it.each(fixture.sampleCases)('$name', ({ contour, beats, expected }) => {
    expect(
      beats.map((beat) => sampleContour(makeContour(contour), beat))
    ).toEqual(expected);
  });

  it.each(fixture.applyCases)(
    '$name',
    ({ contour, notes, mode, expectedVelocities }) => {
      const actual = applyContour(makeContour(contour), notes, mode);

      expect(actual.map((note) => note.velocity)).toEqual(expectedVelocities);
      expect(actual.map((note) => note.id)).toEqual(
        notes.map((note) => note.id)
      );
      expect(actual.map((note) => note.position)).toEqual(
        notes.map((note) => note.position)
      );
    }
  );
});
