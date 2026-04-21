import { Link, usePathname } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type WebSidebarLayoutProps = {
  children: React.ReactNode;
};

const NAV_ITEMS = [
  { label: 'Architect', href: '/' },
  { label: 'Preview', href: '/preview' },
  { label: 'Raw JSON', href: '/code' },
];

export default function WebSidebarLayout({ children }: WebSidebarLayoutProps) {
  const pathname = usePathname();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={styles.page}>
      <View style={styles.sidebar}>
        <View style={styles.brandBlock}>
          <Text style={styles.brand}>Expo Architect</Text>
          <Text style={styles.tagline}>Generate valid Expo app configs from plain English prompts</Text>
        </View>

        <View style={styles.navGroup}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const navButtonStyle = StyleSheet.flatten([
              styles.navButton,
              isActive ? styles.navButtonActive : null,
            ]);
            const navLabelStyle = StyleSheet.flatten([
              styles.navLabel,
              isActive ? styles.navLabelActive : null,
            ]);
            return (
              <Link href={item.href as '/'} asChild key={item.href}>
                <Pressable style={navButtonStyle}>
                  <Text style={navLabelStyle}>{item.label}</Text>
                </Pressable>
              </Link>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Link href="https://harishkotra.me" target="_blank" asChild>
            <Pressable>
              <Text style={styles.footerLink}>Built By Harish Kotra</Text>
            </Pressable>
          </Link>
          <Link href="https://dailybuild.xyz" target="_blank" asChild>
            <Pressable>
              <Text style={styles.footerLink}>Checkout my other builds</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0A0A0A',
  },
  sidebar: {
    width: 280,
    borderRightWidth: 1,
    borderRightColor: '#2F2F2F',
    padding: 20,
    gap: 20,
    justifyContent: 'space-between',
    backgroundColor: '#111111',
  },
  brandBlock: {
    gap: 8,
  },
  brand: {
    color: '#F5F5F5',
    fontWeight: '800',
    fontSize: 22,
  },
  tagline: {
    color: '#AFAFAF',
    lineHeight: 20,
  },
  navGroup: {
    gap: 10,
    flex: 1,
  },
  navButton: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    backgroundColor: '#171717',
  },
  navButtonActive: {
    borderColor: '#FFFFFF',
    backgroundColor: '#F1F1F1',
  },
  navLabel: {
    color: '#D7D7D7',
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#111111',
  },
  footer: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2F2F2F',
  },
  footerLink: {
    color: '#D8D8D8',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
});
