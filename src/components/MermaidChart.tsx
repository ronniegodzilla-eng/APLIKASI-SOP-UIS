import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidChartProps {
  chart: string;
}

export default function MermaidChart({ chart }: MermaidChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
    });
  }, []);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart || !containerRef.current) return;
      
      try {
        setError(null);
        // Clean up the chart string just in case it has markdown code blocks
        let cleanChart = chart.trim();
        if (cleanChart.startsWith('```mermaid')) {
          cleanChart = cleanChart.replace(/^```mermaid\n/, '').replace(/\n```$/, '');
        } else if (cleanChart.startsWith('```')) {
          cleanChart = cleanChart.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        // Generate a unique ID for the chart
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, cleanChart);
        setSvgContent(svg);
      } catch (err: any) {
        console.error('Mermaid rendering error:', err);
        setError(err.message || 'Failed to render chart');
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm">
        <p className="font-semibold mb-1">Gagal merender grafik Mermaid:</p>
        <pre className="whitespace-pre-wrap font-mono text-xs">{error}</pre>
        <div className="mt-4">
          <p className="font-semibold mb-1">Kode mentah:</p>
          <pre className="whitespace-pre-wrap font-mono text-xs bg-white p-2 rounded border border-red-100">{chart}</pre>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full overflow-x-auto bg-white p-4 rounded-lg border border-gray-200 flex justify-center min-h-[200px] items-center"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
