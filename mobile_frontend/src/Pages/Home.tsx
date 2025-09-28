import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { theme } from "@constants/theme";

/*
  Simplified Home screen:
  - No useCallback/useMemo/React.memo to reduce indirection.
  - Plain functions for subcomponents.
  - Straightforward fetch logic with promises.
*/

type Item = {
	id: string;
	title: string;
	subtitle?: string;
};

const mockFetch = async (): Promise<Item[]> => {
	// simulate network latency
	await new Promise((r) => setTimeout(r, 600));
	return Array.from({ length: 12 }).map((_, i) => ({
		id: String(i + 1),
		title: `Item ${i + 1}`,
		subtitle: `Subtitle for item ${i + 1}`,
	}));
};

function Header() {
	return (
		<View style={styles.header}>
			<Text style={styles.headerTitle}>Home</Text>
		</View>
	);
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
	return (
		<View style={styles.searchContainer}>
			<TextInput
				style={styles.searchInput}
				placeholder="Search..."
				value={value}
				onChangeText={onChange}
				placeholderTextColor={theme.colors.placeholder}
				returnKeyType="search"
			/>
		</View>
	);
}

function ItemRow({ item, onPress }: { item: Item; onPress?: (i: Item) => void }) {
	return (
		<TouchableOpacity style={styles.itemRow} onPress={() => onPress?.(item)}>
			<Text style={styles.itemTitle}>{item.title}</Text>
			{item.subtitle ? <Text style={styles.itemSubtitle}>{item.subtitle}</Text> : null}
		</TouchableOpacity>
	);
}

export default function Home(): JSX.Element {
	const [items, setItems] = useState<Item[]>([]);
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	function load() {
		setLoading(true);
		setError(null);
		mockFetch()
			.then((data) => setItems(data))
			.catch(() => setError("Failed to load data."))
			.finally(() => setLoading(false));
	}

	useEffect(() => {
		load();
	}, []);

	const q = query.trim().toLowerCase();
	const filtered = items.filter(
		(it) => !q || it.title.toLowerCase().includes(q) || (it.subtitle || "").toLowerCase().includes(q)
	);

	function onRefresh() {
		load();
	}

	function onItemPress(item: Item) {
		console.log("pressed", item.id);
		// add navigation or details handling here
	}

	return (
		<View style={styles.container}>
			<Header />
			<SearchBar value={query} onChange={setQuery} />

			{loading ? (
				<View style={styles.center}>
					<ActivityIndicator size="large" />
				</View>
			) : error ? (
				<View style={styles.center}>
					<Text style={styles.errorText}>{error}</Text>
					<TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
						<Text style={styles.retryText}>Retry</Text>
					</TouchableOpacity>
				</View>
			) : (
				<FlatList
					data={filtered}
					keyExtractor={(i) => i.id}
					renderItem={({ item }) => <ItemRow item={item} onPress={onItemPress} />}
					contentContainerStyle={filtered.length === 0 ? styles.center : undefined}
					ListEmptyComponent={<Text style={styles.emptyText}>No items found</Text>}
					onRefresh={onRefresh}
					refreshing={loading}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	header: {
		paddingTop: theme.spacing.screenTop,
		paddingBottom: 16,
		paddingHorizontal: theme.spacing.container,
		backgroundColor: theme.colors.surface,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: theme.colors.border,
	},
	headerTitle: {
		fontSize: 22,
		fontWeight: "600",
		color: theme.colors.textPrimary,
	},
	searchContainer: {
		paddingHorizontal: theme.spacing.container,
		paddingVertical: 10,
	},
	searchInput: {
		height: 44,
		backgroundColor: theme.colors.inputBg,
		borderRadius: theme.radii.small,
		paddingHorizontal: 12,
		color: theme.colors.textPrimary,
	},
	itemRow: {
		paddingHorizontal: theme.spacing.container,
		paddingVertical: 14,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "#eee",
	},
	itemTitle: {
		fontSize: 16,
		fontWeight: "500",
		color: theme.colors.textPrimary,
	},
	itemSubtitle: {
		fontSize: 13,
		color: theme.colors.textSecondary,
		marginTop: 4,
	},
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
	errorText: {
		color: theme.colors.error,
		marginBottom: 12,
	},
	retryButton: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		backgroundColor: theme.colors.accent,
		borderRadius: 6,
	},
	retryText: {
		color: "#fff",
		fontWeight: "600",
	},
	emptyText: {
		color: theme.colors.textSecondary,
	},
});
		paddingHorizontal: 12,
		paddingVertical: 8,
		backgroundColor: theme.colors.accent,
		borderRadius: 6,
	},
	retryText: {
		color: "#fff",
		fontWeight: "600",
	},
	emptyText: {
		color: theme.colors.textSecondary,
	},
});
