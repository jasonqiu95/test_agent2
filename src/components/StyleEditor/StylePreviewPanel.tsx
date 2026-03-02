import React from 'react';
import { BookStyle } from '../../types/style';
import './StylePreviewPanel.css';

export interface StylePreviewPanelProps {
  bookStyle: BookStyle;
}

export const StylePreviewPanel: React.FC<StylePreviewPanelProps> = ({ bookStyle }) => {
  // Generate CSS variables from the book style
  const generateStyleVariables = (): React.CSSProperties => {
    return {
      '--body-font': bookStyle.fonts.body,
      '--heading-font': bookStyle.fonts.heading,
      '--body-font-size': bookStyle.body.fontSize,
      '--body-line-height': bookStyle.body.lineHeight,
      '--body-text-align': bookStyle.body.textAlign || 'left',
      '--body-font-weight': bookStyle.body.fontWeight || 'normal',
      '--text-color': bookStyle.colors.text,
      '--heading-color': bookStyle.colors.heading,
      '--background-color': bookStyle.colors.background || '#ffffff',
      '--paragraph-spacing': bookStyle.spacing.paragraphSpacing,
      '--section-spacing': bookStyle.spacing.sectionSpacing,
      '--chapter-spacing': bookStyle.spacing.chapterSpacing,
    } as React.CSSProperties;
  };

  // Generate heading styles
  const getHeadingStyle = (level: 'h1' | 'h2' | 'h3' | 'h4'): React.CSSProperties => {
    const headingConfig = bookStyle.headings[level];
    if (!headingConfig) return {};

    return {
      fontFamily: headingConfig.fontFamily || bookStyle.fonts.heading,
      fontSize: headingConfig.fontSize,
      fontWeight: headingConfig.fontWeight || 'bold',
      lineHeight: headingConfig.lineHeight || '1.2',
      marginTop: headingConfig.marginTop || '0',
      marginBottom: headingConfig.marginBottom || '1rem',
      textTransform: headingConfig.textTransform || 'none',
      letterSpacing: headingConfig.letterSpacing || 'normal',
      color: headingConfig.color || bookStyle.colors.heading,
    };
  };

  // Generate drop cap styles
  const getDropCapStyle = (): React.CSSProperties => {
    if (!bookStyle.dropCap.enabled) return {};

    return {
      float: 'left',
      fontSize: bookStyle.dropCap.fontSize || '3.5em',
      fontFamily: bookStyle.dropCap.fontFamily || bookStyle.fonts.heading,
      fontWeight: bookStyle.dropCap.fontWeight || 'bold',
      color: bookStyle.dropCap.color || bookStyle.colors.dropCap || bookStyle.colors.heading,
      marginRight: bookStyle.dropCap.marginRight || '0.1em',
      lineHeight: bookStyle.dropCap.lines ? `${bookStyle.dropCap.lines * 0.8}` : '0.8',
    };
  };

  // Generate first paragraph styles
  const getFirstParagraphStyle = (): React.CSSProperties => {
    if (!bookStyle.firstParagraph.enabled) return {};

    return {
      textTransform: bookStyle.firstParagraph.textTransform === 'small-caps'
        ? 'lowercase'
        : bookStyle.firstParagraph.textTransform || 'none',
      fontVariant: bookStyle.firstParagraph.textTransform === 'small-caps'
        ? 'small-caps'
        : bookStyle.firstParagraph.fontVariant || 'normal',
      letterSpacing: bookStyle.firstParagraph.letterSpacing || 'normal',
      fontSize: bookStyle.firstParagraph.fontSize || 'inherit',
    };
  };

  // Generate ornamental break styles
  const getOrnamentalBreakStyle = (): React.CSSProperties => {
    if (!bookStyle.ornamentalBreak.enabled) return {};

    return {
      textAlign: 'center',
      fontSize: bookStyle.ornamentalBreak.fontSize || '1.5em',
      margin: bookStyle.ornamentalBreak.spacing || '2rem 0',
      color: bookStyle.colors.accent || bookStyle.colors.heading,
    };
  };

  // Render first paragraph with or without drop cap
  const renderFirstParagraph = () => {
    const text = "In the beginning of the great journey, our hero set forth from the quiet village, leaving behind everything familiar. The morning mist clung to the cobblestones as the first rays of sunlight pierced through the ancient oak trees that lined the winding path ahead.";

    if (bookStyle.dropCap.enabled) {
      const firstLetter = text.charAt(0);
      const restOfText = text.slice(1);

      return (
        <p className="preview-paragraph preview-paragraph--first" style={getFirstParagraphStyle()}>
          <span className="preview-drop-cap" style={getDropCapStyle()}>
            {firstLetter}
          </span>
          {restOfText}
        </p>
      );
    }

    return (
      <p className="preview-paragraph preview-paragraph--first" style={getFirstParagraphStyle()}>
        {text}
      </p>
    );
  };

  return (
    <div className="style-preview-panel" style={generateStyleVariables()}>
      <div className="preview-content">
        {/* Chapter Heading */}
        <h1 className="preview-heading preview-heading--chapter" style={getHeadingStyle('h1')}>
          Chapter One: The Beginning
        </h1>

        {/* First Paragraph with Drop Cap */}
        {renderFirstParagraph()}

        {/* Body Paragraphs */}
        <p className="preview-paragraph">
          The path stretched endlessly before him, winding through rolling hills and verdant meadows.
          Each step carried the weight of destiny, though he knew not yet what fate had in store.
          Birds sang overhead, their melodies weaving through the gentle rustling of leaves,
          creating a symphony that seemed to urge him forward on his quest.
        </p>

        <p className="preview-paragraph">
          As the day wore on, the landscape began to change. The gentle hills gave way to steeper
          terrain, and the friendly oaks were replaced by towering pines that cast long shadows
          across his path. The air grew cooler, carrying with it the scent of distant rain and
          the promise of challenges yet to come.
        </p>

        <p className="preview-paragraph">
          He paused at a crossroads, consulting the ancient map his grandmother had given him.
          The parchment was yellowed with age, its edges worn smooth by countless unfoldings.
          The landmarks depicted seemed both familiar and strange, as if the world itself had
          shifted in the years since the map was drawn.
        </p>

        {/* Ornamental Break */}
        {bookStyle.ornamentalBreak.enabled && (
          <div className="preview-ornamental-break" style={getOrnamentalBreakStyle()}>
            {bookStyle.ornamentalBreak.symbol || '* * *'}
          </div>
        )}

        {/* Section Heading */}
        <h2 className="preview-heading preview-heading--section" style={getHeadingStyle('h2')}>
          The Forest of Whispers
        </h2>

        <p className="preview-paragraph">
          Entering the forest was like stepping into another world entirely. The dense canopy
          overhead filtered the sunlight into ethereal beams that danced through the mist.
          Strange sounds echoed from the depths of the woods—not threatening, but mysterious,
          as if the forest itself was alive and watching with curious eyes.
        </p>

        <p className="preview-paragraph">
          He moved carefully between the ancient trees, their gnarled roots creating a labyrinth
          across the forest floor. Moss covered everything in a thick carpet of green, muffling
          his footsteps and adding to the otherworldly silence. Time seemed to move differently
          here, measured not in hours but in the patient growth of trees and the slow decay of
          fallen leaves.
        </p>

        {/* Subsection Heading */}
        <h3 className="preview-heading preview-heading--subsection" style={getHeadingStyle('h3')}>
          The Clearing
        </h3>

        <p className="preview-paragraph">
          After what felt like days but might have been mere hours, he stumbled into a clearing.
          Sunlight flooded the open space, warm and welcoming after the cool dimness of the forest.
          In the center stood a weathered stone monument, covered in runes that seemed to shimmer
          and shift when viewed from different angles.
        </p>

        <p className="preview-paragraph">
          As he approached the monument, he felt a strange resonance, as if the stone was calling
          to something deep within him. The runes began to glow with a soft blue light, and he
          realized with a start that he could read them. They spoke of an ancient prophecy, of a
          journey that would test not just his strength, but his very soul.
        </p>

        <p className="preview-paragraph">
          With newfound determination, he pressed onward. The forest eventually gave way to open
          plains, and beyond them, mountains rose like teeth against the horizon. His journey was
          far from over—in truth, it had only just begun. But armed with the knowledge from the
          monument and the courage in his heart, he knew he would face whatever challenges lay ahead.
        </p>
      </div>
    </div>
  );
};
