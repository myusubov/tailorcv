'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Link,
} from '@react-pdf/renderer';
import type { BaseResumeData } from 'shared';

// Register standard fonts
Font.register({
  family: 'Helvetica',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/helveticaneue/v1/1PTSg8zYS_SKfqw6dQRojH6nJ5k.ttf',
    },
    {
      src: 'https://fonts.gstatic.com/s/helveticaneue/v1/1PTSg8zYS_SKfqw6dQRojc2hJ5k.ttf',
      fontWeight: 'bold',
    },
    {
      src: 'https://fonts.gstatic.com/s/helveticaneue/v1/1PTSg8zYS_SKfqw6dQRojZ2hJ5k.ttf',
      fontStyle: 'italic',
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
    color: '#000000',
  },
  // Header Section
  header: {
    marginBottom: 8,
    paddingBottom: 0,
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold', // Helvetica-Bold
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
    lineHeight: 1.2,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  contactItem: {
    fontSize: 9,
    color: '#000',
    textDecoration: 'none',
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#000',
  },

  // Content Blocks
  block: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  primaryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  dateText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'right',
    minWidth: 80,
  },
  subtitleText: {
    fontSize: 10,
    fontStyle: 'italic', // Helvetica-Oblique
    color: '#000',
    marginBottom: 3,
  },

  // Bullets
  bulletContainer: {
    marginLeft: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bulletPoint: {
    width: 8,
    fontSize: 12,
    lineHeight: 1.2,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    textAlign: 'justify',
  },

  // Skills
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillText: {
    fontSize: 10,
  },
  summaryText: {
    fontSize: 10,
    textAlign: 'justify',
    marginBottom: 5,
  },
});

interface ResumePDFProps {
  data: BaseResumeData;
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '';
  // Try to parse YYYY-MM
  const parts = dateString.split('-');
  if (parts.length >= 2) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${year}`; // e.g., "Jan 2023"
    }
  }
  return dateString; // Fallback to raw string (e.g. "2024")
};

const renderDateRange = (
  start?: string | null,
  end?: string | null,
  isCurrent?: boolean | null,
) => {
  const formattedStart = formatDate(start);

  // Treat as present if:
  // 1. isCurrent is explicitly true (boolean or string)
  // 2. OR isCurrent is NOT explicitly false, AND end date is missing, AND start date exists.
  // This handles cases where AI omits isCurrent but leaves endDate null.
  const isExplicitlyFalse =
    isCurrent === false || String(isCurrent) === 'false';
    
  const isExplicitlyTrue = 
    isCurrent === true || String(isCurrent) === 'true';

  const isPresent =
    isExplicitlyTrue || (!isExplicitlyFalse && !end && !!start);

  const formattedEnd = isPresent ? 'Present' : formatDate(end);

  if (!formattedStart && !formattedEnd) return null;
  
  if (!formattedStart) {
    return <Text style={styles.dateText}>{formattedEnd}</Text>;
  }

  return (
    <Text style={styles.dateText}>
      {formattedStart}
      {formattedEnd ? ` – ${formattedEnd}` : ''}
    </Text>
  );
};

export const ResumePDFTemplate = ({ data }: ResumePDFProps) => {
  const { contact, summary, skills, experience, projects, education } = data;

  return (
    <Document
      title={`${contact.firstName}_${contact.lastName}_Resume`}
      author={`${contact.firstName} ${contact.lastName}`}
      subject="Resume"
      language="en"
    >
      <Page size="LETTER" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {contact.firstName} {contact.lastName}
          </Text>
          <View style={styles.contactRow}>
            {contact.location && (
              <Text style={styles.contactItem}>{contact.location}</Text>
            )}
            {contact.phone && (
              <>
                <Text style={styles.contactItem}>•</Text>
                <Text style={styles.contactItem}>{contact.phone}</Text>
              </>
            )}
            <Text style={styles.contactItem}>•</Text>
            <Link src={`mailto:${contact.email}`} style={styles.contactItem}>
              {contact.email}
            </Link>
            {contact.websiteUrl && (
              <>
                <Text style={styles.contactItem}>•</Text>
                <Link src={contact.websiteUrl} style={styles.contactItem}>
                  Website
                </Link>
              </>
            )}
            {contact.linkedinUrl && (
              <>
                <Text style={styles.contactItem}>•</Text>
                <Link src={contact.linkedinUrl} style={styles.contactItem}>
                  LinkedIn
                </Link>
              </>
            )}
            {contact.githubUrl && (
              <>
                <Text style={styles.contactItem}>•</Text>
                <Link src={contact.githubUrl} style={styles.contactItem}>
                  GitHub
                </Link>
              </>
            )}
          </View>
        </View>

        {/* SUMMARY */}
        {summary && (
          <View style={styles.block}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <View style={styles.line} />
            </View>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        )}

        {/* EDUCATION (Often top for new grads, but variable. We place it here or bottom) */}
        {education && education.length > 0 && (
          <View style={styles.block}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Education</Text>
              <View style={styles.line} />
            </View>
            {education.map((edu, index) => (
              <View key={edu.id || index} style={{ marginBottom: 4 }}>
                <View style={styles.row}>
                  <Text style={styles.primaryText}>{edu.school}</Text>
                  {renderDateRange(edu.startDate, edu.endDate)}
                </View>
                <View style={styles.row}>
                  <Text style={styles.subtitleText}>
                    {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                  </Text>
                  {edu.location && (
                    <Text
                      style={[styles.subtitleText, { fontStyle: 'normal' }]}
                    >
                      {edu.location}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* EXPERIENCE */}
        {experience && experience.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Experience</Text>
              <View style={styles.line} />
            </View>
            {experience.map((exp, index) => (
              <View key={exp.id || index} style={styles.block} wrap>
                {/* Company Name & Date */}
                <View style={styles.row}>
                  <Text style={styles.primaryText}>{exp.company}</Text>
                  {renderDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                </View>

                {/* Title & Location */}
                <View style={styles.row}>
                  <Text style={styles.subtitleText}>{exp.title}</Text>
                  {exp.location && (
                    <Text
                      style={[styles.subtitleText, { fontStyle: 'normal' }]}
                    >
                      {exp.location}
                    </Text>
                  )}
                </View>

                {/* Bullets */}
                <View style={styles.bulletContainer}>
                  {(exp.bullets || []).map((bullet, i) => (
                    <View key={bullet.id || i} style={styles.bulletRow}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.bulletText}>{bullet.text}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </>
        )}

        {/* PROJECTS */}
        {projects && projects.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Projects</Text>
              <View style={styles.line} />
            </View>
            {projects.map((proj, index) => (
              <View key={proj.id || index} style={styles.block} wrap>
                <View style={styles.row}>
                  <Text style={styles.primaryText}>{proj.name}</Text>
                  {renderDateRange(proj.startDate, proj.endDate, proj.isCurrent)}
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 2,
                  }}
                >
                  {proj.role && (
                    <Text
                      style={[
                        styles.subtitleText,
                        { marginBottom: 0, marginRight: 8 },
                      ]}
                    >
                      {proj.role}
                    </Text>
                  )}

                  {(proj.url || proj.repoUrl) && (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {proj.role && (
                        <Text style={{ fontSize: 10, color: '#000' }}>•</Text>
                      )}
                      {proj.url && (
                        <Link src={proj.url} style={styles.contactItem}>
                          Live Demo
                        </Link>
                      )}
                      {proj.url && proj.repoUrl && (
                        <Text style={{ fontSize: 10, color: '#000' }}>•</Text>
                      )}
                      {proj.repoUrl && (
                        <Link src={proj.repoUrl} style={styles.contactItem}>
                          GitHub
                        </Link>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.bulletContainer}>
                  {(proj.bullets || []).map((bullet, i) => (
                    <View key={bullet.id || i} style={styles.bulletRow}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.bulletText}>{bullet.text}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </>
        )}

        {/* SKILLS */}
        {skills && skills.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Technical Skills</Text>
              <View style={styles.line} />
            </View>
            <View>
              {Object.entries(
                skills.reduce(
                  (acc, skill) => {
                    const cat = skill.category || 'Other';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(skill.name);
                    return acc;
                  },
                  {} as Record<string, string[]>,
                ),
              ).map(([category, names], index) => (
                <View
                  key={category}
                  style={{ flexDirection: 'row', marginBottom: 2 }}
                >
                  <Text style={[styles.primaryText, { width: 100 }]}>
                    {category}:
                  </Text>
                  <Text style={[styles.skillText, { flex: 1 }]}>
                    {names.join(', ')}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Page>
    </Document>
  );
};
