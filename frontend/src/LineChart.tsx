import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line } from 'react-native-svg';
import { useTheme } from './theme';

interface Point { date: string; rate: number; }

interface Props {
  points: Point[];
  width: number;
  height: number;
}

export function LineChart({ points, width, height }: Props) {
  const { colors } = useTheme();
  if (!points || points.length < 2) return <View style={{ width, height }} />;

  const pad = { left: 8, right: 8, top: 12, bottom: 12 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;

  const min = Math.min(...points.map(p => p.rate));
  const max = Math.max(...points.map(p => p.rate));
  const range = max - min || 1;

  const xy = points.map((p, i) => {
    const x = pad.left + (i / (points.length - 1)) * w;
    const y = pad.top + (1 - (p.rate - min) / range) * h;
    return { x, y };
  });

  const path = xy
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  const fill = `${path} L ${xy[xy.length - 1].x} ${pad.top + h} L ${xy[0].x} ${pad.top + h} Z`;

  const last = xy[xy.length - 1];

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.chartLine} stopOpacity="0.35" />
          <Stop offset="1" stopColor={colors.chartLine} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Line x1={pad.left} y1={pad.top + h} x2={pad.left + w} y2={pad.top + h} stroke={colors.border} strokeWidth={1} />
      <Path d={fill} fill="url(#grad)" />
      <Path d={path} stroke={colors.chartLine} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={last.x} cy={last.y} r={4} fill={colors.chartLine} />
      <Circle cx={last.x} cy={last.y} r={8} fill={colors.chartLine} fillOpacity={0.2} />
    </Svg>
  );
}

const styles = StyleSheet.create({});
