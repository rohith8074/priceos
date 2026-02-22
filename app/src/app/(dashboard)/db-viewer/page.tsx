"use client";

import { useState } from "react";

interface TableData {
    summary: {
        listings: number;
        inventory_master: number;
        activity_timeline: number;
        events: number;
        chat_messages: number;
        user_settings: number;
    };
    date_ranges: {
        calendar: { min: string; max: string };
        reservations: { min: string; max: string };
    };
    data: {
        listings: Record<string, unknown>[];
        inventory_master: Record<string, unknown>[];
        activity_timeline: Record<string, unknown>[];
        events: Record<string, unknown>[];
        chat_messages: Record<string, unknown>[];
        user_settings: Record<string, unknown>[];
    };
}

type TableName = "listings" | "inventory_master" | "activity_timeline" | "events" | "chat_messages" | "user_settings";

export default function DbViewerPage() {
    const [data, setData] = useState<TableData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTable, setActiveTable] = useState<TableName>("listings");
    const [filterText, setFilterText] = useState("");

    const TableCellContent = ({ content }: { content: string }) => {
        const [expanded, setExpanded] = useState(false);
        const isLong = content.length > 100;

        if (!isLong) return <span>{content}</span>;

        return (
            <div>
                <div
                    style={{
                        whiteSpace: expanded ? "pre-wrap" : "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: expanded ? "600px" : "300px",
                        wordBreak: expanded ? "break-word" : "normal",
                        maxHeight: expanded ? "300px" : "auto",
                        overflowY: expanded ? "auto" : "visible"
                    }}
                >
                    {expanded ? content : content.slice(0, 100) + "..."}
                </div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    style={{
                        background: "transparent",
                        color: "#00cec9",
                        border: "none",
                        padding: "4px 0",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        marginTop: "4px",
                        fontWeight: 600
                    }}
                >
                    {expanded ? "Show less" : "Show more"}
                </button>
            </div>
        );
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/db-viewer");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to fetch");
        } finally {
            setLoading(false);
        }
    };

    const tables: { key: TableName; label: string; color: string }[] = [
        { key: "listings", label: "Listings", color: "#6c5ce7" },
        { key: "inventory_master", label: "Inventory Master", color: "#00b894" },
        { key: "activity_timeline", label: "Activity Timeline (Raw)", color: "#74b9ff" },
        { key: "events", label: "Market Events Filter", color: "#e17055" },
        { key: "chat_messages", label: "Chat Messages", color: "#fdcb6e" },
        { key: "user_settings", label: "User Settings", color: "#e84393" },
    ];

    const renderTable = (rows: Record<string, unknown>[]) => {
        const filteredRows = rows.filter(row => {
            if (!filterText) return true;
            return Object.values(row).some(val =>
                String(val === null ? "NULL" : typeof val === "object" ? JSON.stringify(val) : val)
                    .toLowerCase()
                    .includes(filterText.toLowerCase())
            );
        });

        if (!filteredRows.length && !rows.length) return <p style={{ color: "#8b90a5", padding: "20px" }}>No data found</p>;
        if (!filteredRows.length) return <p style={{ color: "#8b90a5", padding: "20px" }}>No matching rows found</p>;

        const columns = Object.keys(rows[0]);
        return (
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col}
                                    style={{
                                        background: "#1a1d27",
                                        color: "#00cec9",
                                        padding: "8px 12px",
                                        border: "1px solid #2d3348",
                                        textAlign: "left",
                                        whiteSpace: "nowrap",
                                        fontWeight: 600,
                                    }}
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.map((row, i) => (
                            <tr key={i}>
                                {columns.map((col) => (
                                    <td
                                        key={col}
                                        style={{
                                            padding: "6px 12px",
                                            border: "1px solid #2d3348",
                                            color: "#e4e7f1",
                                            verticalAlign: "top"
                                        }}
                                    >
                                        <TableCellContent
                                            content={row[col] === null
                                                ? "NULL"
                                                : typeof row[col] === "object"
                                                    ? JSON.stringify(row[col], null, 2)
                                                    : String(row[col])}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div
            style={{
                height: "100%",
                overflowY: "auto",
                background: "#0f1117",
                color: "#e4e7f1",
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                padding: "40px 24px",
            }}
        >
            <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
                <h1
                    style={{
                        fontSize: "1.8rem",
                        background: "linear-gradient(135deg, #6c5ce7, #00cec9)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        color: "transparent",
                        marginBottom: "8px",
                    }}
                >
                    🗄️ Database Viewer
                </h1>
                <p style={{ color: "#8b90a5", marginBottom: "24px" }}>
                    Inspect all 3 tables — READ-ONLY snapshot (all rows)
                </p>

                {/* Fetch Button */}
                <button
                    onClick={fetchData}
                    disabled={loading}
                    style={{
                        background: loading ? "#2d3348" : "linear-gradient(135deg, #6c5ce7, #00cec9)",
                        color: "#fff",
                        border: "none",
                        padding: "12px 32px",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        fontWeight: 600,
                        cursor: loading ? "wait" : "pointer",
                        marginBottom: "24px",
                    }}
                >
                    {loading ? "Loading..." : data ? "🔄 Refresh Data" : "📊 Load Database Data"}
                </button>

                {error && (
                    <div
                        style={{
                            background: "#e1705520",
                            border: "1px solid #e17055",
                            borderRadius: "8px",
                            padding: "12px 16px",
                            color: "#e17055",
                            marginBottom: "16px",
                        }}
                    >
                        ⚠️ {error}
                    </div>
                )}

                {data && (
                    <>
                        {/* Summary Cards */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: "16px",
                                marginBottom: "24px",
                            }}
                        >
                            {tables.map((t) => (
                                <div
                                    key={t.key}
                                    onClick={() => setActiveTable(t.key)}
                                    style={{
                                        background: activeTable === t.key ? "#222633" : "#1a1d27",
                                        border: `2px solid ${activeTable === t.key ? t.color : "#2d3348"}`,
                                        borderRadius: "12px",
                                        padding: "16px",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <div style={{ fontSize: "0.8rem", color: "#8b90a5", marginBottom: "4px" }}>
                                        {t.label}
                                    </div>
                                    <div style={{ fontSize: "1.8rem", fontWeight: 700, color: t.color }}>
                                        {data.summary[t.key]}
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "#8b90a5" }}>rows</div>
                                </div>
                            ))}
                        </div>

                        {/* Date Ranges */}
                        <div
                            style={{
                                background: "#1a1d27",
                                border: "1px solid #2d3348",
                                borderRadius: "8px",
                                padding: "12px 16px",
                                marginBottom: "24px",
                                fontSize: "0.85rem",
                                display: "flex",
                                gap: "32px",
                            }}
                        >
                            <span>
                                <strong style={{ color: "#00b894" }}>Calendar range:</strong>{" "}
                                {data.date_ranges.calendar?.min ?? "N/A"} → {data.date_ranges.calendar?.max ?? "N/A"}
                            </span>
                            <span>
                                <strong style={{ color: "#74b9ff" }}>Reservations range:</strong>{" "}
                                {data.date_ranges.reservations?.min ?? "N/A"} →{" "}
                                {data.date_ranges.reservations?.max ?? "N/A"}
                            </span>
                        </div>

                        {/* Table Tabs */}
                        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                            {tables.map((t) => (
                                <button
                                    key={t.key}
                                    onClick={() => setActiveTable(t.key)}
                                    style={{
                                        background: activeTable === t.key ? t.color + "30" : "#1a1d27",
                                        color: activeTable === t.key ? t.color : "#8b90a5",
                                        border: `1px solid ${activeTable === t.key ? t.color : "#2d3348"}`,
                                        padding: "8px 16px",
                                        borderRadius: "8px",
                                        fontSize: "0.85rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                    }}
                                >
                                    {t.label} ({data.summary[t.key]})
                                </button>
                            ))}
                        </div>

                        {/* Data Table */}
                        <div
                            style={{
                                background: "#1a1d27",
                                border: "1px solid #2d3348",
                                borderRadius: "12px",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    padding: "12px 16px",
                                    borderBottom: "1px solid #2d3348",
                                    fontSize: "0.85rem",
                                    color: "#8b90a5",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}
                            >
                                <div>
                                    Showing rows from{" "}
                                    <strong style={{ color: tables.find((t) => t.key === activeTable)?.color }}>
                                        {activeTable}
                                    </strong>
                                </div>
                                <input
                                    type="text"
                                    placeholder="🔍 Search in this table..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    style={{
                                        background: "#12141c",
                                        border: "1px solid #2d3348",
                                        color: "#e4e7f1",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        fontSize: "0.85rem",
                                        width: "250px",
                                        outline: "none"
                                    }}
                                />
                            </div>
                            {renderTable(data.data[activeTable])}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
