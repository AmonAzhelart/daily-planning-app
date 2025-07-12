import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, CartesianGrid } from 'recharts';
import { Box, Typography, Paper, CircularProgress, Alert, Tooltip as MuiTooltip } from '@mui/material'; // Importato Tooltip da MUI

// --- PROPS GENERICHE (invariate) ---
interface StatsBarChartProps<T> {
    title: string;
    fetchData: () => Promise<T[]>;
    categoryKey: keyof T;
    valueKey: keyof T;
    tooltipLabel: string;
}

// --- TOOLTIP DEL GRAFICO (invariato) ---
const CustomChartTooltip = ({ active, payload, label, tooltipLabel }: any) => {
    if (active && payload && payload.length) {
        return (
            <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{label}</Typography>
                <Typography variant="body2" color="primary">
                    {`${tooltipLabel}: ${payload[0].value}`}
                </Typography>
            </Paper>
        );
    }
    return null;
};

// --- NUOVO COMPONENTE PER LE ETICHETTE DELL'ASSE Y CON TOOLTIP ---
const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const fullText = payload.value;

    const formatTick = (text: string) => {
        const limit = 20; // Limite di caratteri per l'etichetta visibile
        return text.length > limit ? `${text.substring(0, limit)}...` : text;
    };

    return (
        // Il <g> è un contenitore SVG richiesto da Recharts per i tick personalizzati
        <g transform={`translate(${x},${y})`}>
            {/* Usiamo il Tooltip di MUI che avvolge il testo dell'etichetta */}
            <MuiTooltip title={fullText} placement="right" arrow>
                <text x={0} y={0} dy={4} textAnchor="end" fill="#555" fontSize={12}>
                    {formatTick(fullText)}
                </text>
            </MuiTooltip>
        </g>
    );
};


// --- COMPONENTE GRAFICO GENERICO (aggiornato) ---
export const StatsBarChart = <T extends object>({
    title,
    fetchData,
    categoryKey,
    valueKey,
    tooltipLabel,
}: StatsBarChartProps<T>) => {

    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadChartData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetchData();
                const sorted = [...response].sort((a, b) => (b[valueKey] as number) - (a[valueKey] as number));
                setData(sorted);
            } catch (err) {
                console.error(`Errore nel caricamento dei dati per "${title}":`, err);
                setError('Impossibile caricare i dati.');
            } finally {
                setLoading(false);
            }
        };
        loadChartData();
    }, [fetchData, title, valueKey]);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }} gutterBottom>
                {title}
            </Typography>
            <Box sx={{ height: { xs: 300, sm: 400, md: 500 } }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.9} />
                                <stop offset="95%" stopColor="#ca82af" stopOpacity={0.9} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e0e0" />
                        <XAxis type="number" hide />

                        {/* MODIFICA: Usiamo il nostro componente personalizzato per renderizzare le etichette */}
                        <YAxis
                            type="category"
                            dataKey={categoryKey as string}
                            width={150}
                            axisLine={false}
                            tickLine={false}
                            tick={<CustomYAxisTick />} // Qui avviene la magia!
                        />

                        <Tooltip
                            cursor={{ fill: 'rgba(230, 230, 230, 0.5)' }}
                            content={<CustomChartTooltip tooltipLabel={tooltipLabel} />}
                        />
                        <Bar dataKey={valueKey as string} fill="url(#chartGradient)" radius={[0, 8, 8, 0]}>
                            <LabelList dataKey={valueKey as string} position="right" style={{ fill: '#333', fontWeight: 'bold' }} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};