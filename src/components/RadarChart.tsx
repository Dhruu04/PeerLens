import React, { useState } from 'react';

export interface RadarMetric {
  id: string;
  name: string;
  max: number;
}

export interface RadarSeries {
  id: string;
  name: string;
  color: string;
  values: Record<string, number | null>; // metricId -> score
}

interface RadarChartProps {
  metrics: RadarMetric[];
  series: RadarSeries[];
  size?: number;
  className?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  metrics,
  series,
  size = 360,
  className = ''
}) => {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  if (!metrics || metrics.length < 3) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        At least 3 grading criteria are required to render the multi-axis radar chart.
      </div>
    );
  }

  const center = size / 2;
  const radius = (size / 2) * 0.72;
  const angleStep = (Math.PI * 2) / metrics.length;
  const numLevels = 4; // concentric grid circles (25%, 50%, 75%, 100%)

  // Helper to convert polar coordinates (angle, normalized radius 0..1) to Cartesian {x, y}
  const getCoordinates = (angle: number, normR: number) => {
    // Start from top (- PI / 2)
    const currentAngle = angle - Math.PI / 2;
    const r = normR * radius;
    return {
      x: center + r * Math.cos(currentAngle),
      y: center + r * Math.sin(currentAngle)
    };
  };

  // Generate concentric level polygons
  const gridLevels = Array.from({ length: numLevels }, (_, i) => {
    const levelRatio = (i + 1) / numLevels;
    const points = metrics.map((_, idx) => {
      const angle = idx * angleStep;
      const { x, y } = getCoordinates(angle, levelRatio);
      return `${x},${y}`;
    }).join(' ');
    return { levelRatio, points };
  });

  // Generate axes lines
  const axes = metrics.map((metric, idx) => {
    const angle = idx * angleStep;
    const pOuter = getCoordinates(angle, 1);
    const pLabel = getCoordinates(angle, 1.18);
    return {
      metric,
      angle,
      x2: pOuter.x,
      y2: pOuter.y,
      labelX: pLabel.x,
      labelY: pLabel.y
    };
  });

  // Calculate polygon points for each series
  const seriesPolygons = series.map((s) => {
    const points = metrics.map((metric, idx) => {
      const angle = idx * angleStep;
      const rawVal = s.values[metric.id];
      const normVal = rawVal !== null && typeof rawVal === 'number' ? Math.min(Math.max(rawVal / metric.max, 0), 1) : 0;
      const { x, y } = getCoordinates(angle, normVal);
      return { x, y, rawVal, normVal, metric };
    });
    const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');
    return {
      series: s,
      points,
      pointsString
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }} className={className}>
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible', maxWidth: '100%', height: 'auto' }}
      >
        {/* Background Grids */}
        {gridLevels.map(({ points }, idx) => (
          <polygon
            key={idx}
            points={points}
            fill={idx % 2 === 0 ? 'var(--bg-app)' : 'transparent'}
            stroke="var(--border-color)"
            strokeWidth="1"
            strokeDasharray={idx === numLevels - 1 ? 'none' : '3,3'}
            opacity={0.8}
          />
        ))}

        {/* Axis Lines */}
        {axes.map((axis) => (
          <line
            key={axis.metric.id}
            x1={center}
            y1={center}
            x2={axis.x2}
            y2={axis.y2}
            stroke="var(--border-color)"
            strokeWidth="1"
          />
        ))}

        {/* Series Filled Polygons */}
        {seriesPolygons.map(({ series: s, pointsString }) => (
          <g key={s.id}>
            <polygon
              points={pointsString}
              fill={s.color}
              fillOpacity={0.18}
              stroke={s.color}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </g>
        ))}

        {/* Data Point Dots */}
        {seriesPolygons.map(({ series: s, points }) => (
          <g key={`dots-${s.id}`}>
            {points.map((pt, idx) => (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r="4.5"
                fill={s.color}
                stroke="var(--bg-card)"
                strokeWidth="1.5"
                style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                onMouseEnter={() => setHoveredMetric(pt.metric.id)}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                <title>{`${s.name} - ${pt.metric.name}: ${pt.rawVal !== null ? pt.rawVal.toFixed(1) : 'N/A'} / ${pt.metric.max}`}</title>
              </circle>
            ))}
          </g>
        ))}

        {/* Metric Labels */}
        {axes.map((axis) => {
          const isHovered = hoveredMetric === axis.metric.id;
          return (
            <text
              key={`label-${axis.metric.id}`}
              x={axis.labelX}
              y={axis.labelY}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={isHovered ? '11px' : '9.5px'}
              fontWeight={isHovered ? '800' : '600'}
              fill={isHovered ? 'var(--primary)' : 'var(--text-secondary)'}
              style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
              onMouseEnter={() => setHoveredMetric(axis.metric.id)}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              {axis.metric.name}
            </text>
          );
        })}
      </svg>

      {/* Series Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.25rem', marginTop: '0.75rem' }}>
        {series.map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', fontWeight: 600 }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: s.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-primary)' }}>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RadarChart;
