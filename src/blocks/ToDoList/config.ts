import type { Block } from 'payload'

export const ToDoListBlock: Block = {
  slug: 'todoList',
  interfaceName: 'ToDoListBlock',
  fields: [
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      labels: {
        singular: 'To-do item',
        plural: 'To-do items',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'checked',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'showCopyButton',
      type: 'checkbox',
      defaultValue: false,
      label: 'Show "Copy list" button',
    },
    {
      name: 'copyButtonLabel',
      type: 'text',
      defaultValue: 'Copy list',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.showCopyButton),
      },
    },
  ],
}
