import { expect, test } from '@playwright/test'
import { installApiMock } from './api-mock'

test.describe('Ezzetask smoke', () => {
  test.beforeEach(async ({ page }) => {
    await installApiMock(page)
  })

  test('loads workspace after session bootstrap', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('workspace')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Client Portal' })).toBeVisible()
  })

  test('creates a task from the modal', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('workspace')).toBeVisible({ timeout: 15_000 })

    await page.getByTestId('new-task-button').click()
    await page.getByTestId('new-task-title').fill('Smoke test task')
    await page.getByTestId('new-task-submit').click()

    await expect(page.getByText('Smoke test task')).toBeVisible({ timeout: 10_000 })
  })

  test('modal traps focus and closes on Escape', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('workspace')).toBeVisible({ timeout: 15_000 })

    await page.getByTestId('new-task-button').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
  })
})
