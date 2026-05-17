import type { Block } from 'payload'

import { Archive } from './ArchiveBlock/config'
import { Banner } from './Banner/config'
import { CallToAction } from './CallToAction/config'
import { ChapterCitationBlock } from './ChapterCitation/config'
import { Content } from './Content/config'
import { DoDontCardBlock } from './DoDontCard/config'
import { DropdownBlock } from './Dropdown/config'
import { FloatImageBlock } from './FloatImage/config'
import { FormBlock } from './Form/config'
import { InfoBoxBlock } from './InfoBox/config'
import { MediaBlock } from './MediaBlock/config'
import { ProcedureTypeCardBlock } from './ProcedureTypeCard/config'
import { TimelineBlock } from './Timeline/config'
import { ToDoListBlock } from './ToDoList/config'
import { TwoColumnImagesBlock } from './TwoColumnImages/config'

/**
 * Root-level Payload blocks registry. Lexical stores block nodes by `blockType` slug; the
 * content translator plugin resolves nested block fields only via `config.blocks`, not via
 * `BlocksFeature` definitions alone ({@link https://github.com/jhb-software/payload-plugins}).
 */
export const lexicalBlocksForConfig: Block[] = [
  Archive,
  Banner,
  CallToAction,
  ChapterCitationBlock,
  Content,
  DoDontCardBlock,
  DropdownBlock,
  FloatImageBlock,
  FormBlock,
  InfoBoxBlock,
  MediaBlock,
  ProcedureTypeCardBlock,
  TimelineBlock,
  ToDoListBlock,
  TwoColumnImagesBlock,
]
