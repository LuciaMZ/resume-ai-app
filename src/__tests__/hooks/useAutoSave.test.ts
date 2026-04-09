import { renderHook } from '@testing-library/react';
import { useAutoSave } from '@/hooks/useAutoSave';
import { setStorageItem, STORAGE_KEYS } from '@/lib/storage';
import type { ResumeData } from '@/types/resume';

vi.mock('@/lib/storage', () => ({
  setStorageItem: vi.fn(),
  STORAGE_KEYS: { RESUME_DATA: 'resumeAIapp:resume' },
}));

const mockedSetStorageItem = vi.mocked(setStorageItem);

function createMockResumeData(overrides?: Partial<ResumeData>): ResumeData {
  return {
    meta: {
      id: 'test-id',
      templateId: 'classic',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      schemaVersion: 1,
    },
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
      location: 'New York, NY',
    },
    sections: [],
    ...overrides,
  };
}

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does NOT save on initial render', () => {
    const data = createMockResumeData();

    renderHook(() => useAutoSave(data));

    vi.advanceTimersByTime(1000);

    expect(mockedSetStorageItem).not.toHaveBeenCalled();
  });

  it('saves after debounce delay when data changes', () => {
    const initialData = createMockResumeData();
    const updatedData = createMockResumeData({
      personalInfo: {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '555-5678',
        location: 'Los Angeles, CA',
      },
    });

    const { rerender } = renderHook(({ data }) => useAutoSave(data), {
      initialProps: { data: initialData },
    });

    // Change data to trigger the save
    rerender({ data: updatedData });

    // Before debounce fires, nothing should be saved
    expect(mockedSetStorageItem).not.toHaveBeenCalled();

    // Advance past the default 500ms debounce
    vi.advanceTimersByTime(500);

    expect(mockedSetStorageItem).toHaveBeenCalledTimes(1);
    expect(mockedSetStorageItem).toHaveBeenCalledWith(
      STORAGE_KEYS.RESUME_DATA,
      updatedData
    );
  });

  it('clears previous timeout when data changes rapidly - only last save fires', () => {
    const data1 = createMockResumeData();
    const data2 = createMockResumeData({
      personalInfo: {
        firstName: 'Alice',
        lastName: 'Doe',
        email: 'alice@example.com',
        phone: '555-0001',
        location: 'Chicago, IL',
      },
    });
    const data3 = createMockResumeData({
      personalInfo: {
        firstName: 'Bob',
        lastName: 'Doe',
        email: 'bob@example.com',
        phone: '555-0002',
        location: 'Denver, CO',
      },
    });

    const { rerender } = renderHook(({ data }) => useAutoSave(data), {
      initialProps: { data: data1 },
    });

    // First data change
    rerender({ data: data2 });
    vi.advanceTimersByTime(200);

    // Second rapid change before debounce fires
    rerender({ data: data3 });
    vi.advanceTimersByTime(200);

    // At 400ms total since last change, still nothing saved
    expect(mockedSetStorageItem).not.toHaveBeenCalled();

    // Advance to 500ms after the last change
    vi.advanceTimersByTime(300);

    expect(mockedSetStorageItem).toHaveBeenCalledTimes(1);
    expect(mockedSetStorageItem).toHaveBeenCalledWith(
      STORAGE_KEYS.RESUME_DATA,
      data3
    );
  });

  it('uses default delay of 500ms', () => {
    const initialData = createMockResumeData();
    const updatedData = createMockResumeData({
      personalInfo: {
        firstName: 'Updated',
        lastName: 'User',
        email: 'updated@example.com',
        phone: '555-9999',
        location: 'Boston, MA',
      },
    });

    const { rerender } = renderHook(({ data }) => useAutoSave(data), {
      initialProps: { data: initialData },
    });

    rerender({ data: updatedData });

    // At 499ms, should not have saved yet
    vi.advanceTimersByTime(499);
    expect(mockedSetStorageItem).not.toHaveBeenCalled();

    // At 500ms, should save
    vi.advanceTimersByTime(1);
    expect(mockedSetStorageItem).toHaveBeenCalledTimes(1);
  });

  it('respects a custom delay', () => {
    const initialData = createMockResumeData();
    const updatedData = createMockResumeData({
      personalInfo: {
        firstName: 'Custom',
        lastName: 'Delay',
        email: 'custom@example.com',
        phone: '555-7777',
        location: 'Seattle, WA',
      },
    });

    const { rerender } = renderHook(
      ({ data, delay }) => useAutoSave(data, delay),
      { initialProps: { data: initialData, delay: 1000 } }
    );

    rerender({ data: updatedData, delay: 1000 });

    vi.advanceTimersByTime(999);
    expect(mockedSetStorageItem).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(mockedSetStorageItem).toHaveBeenCalledTimes(1);
  });

  it('flushes pending save on unmount', () => {
    const initialData = createMockResumeData();
    const updatedData = createMockResumeData({
      personalInfo: {
        firstName: 'Unmount',
        lastName: 'Test',
        email: 'unmount@example.com',
        phone: '555-3333',
        location: 'Miami, FL',
      },
    });

    const { rerender, unmount } = renderHook(
      ({ data }) => useAutoSave(data),
      { initialProps: { data: initialData } }
    );

    // Change data to start a debounce
    rerender({ data: updatedData });

    // Unmount before debounce fires
    unmount();

    // The unmount flush should persist the latest data, not stale initial data.
    expect(mockedSetStorageItem).toHaveBeenCalledWith(
      STORAGE_KEYS.RESUME_DATA,
      updatedData
    );
  });

  it('flushes the latest state on unmount after rapid updates mid-debounce', () => {
    const initialData = createMockResumeData();
    const data2 = createMockResumeData({
      personalInfo: {
        firstName: 'First',
        lastName: 'Update',
        email: 'first@example.com',
        phone: '555-2000',
        location: 'Austin, TX',
      },
    });
    const data3 = createMockResumeData({
      personalInfo: {
        firstName: 'Latest',
        lastName: 'Update',
        email: 'latest@example.com',
        phone: '555-3000',
        location: 'Portland, OR',
      },
    });

    const { rerender, unmount } = renderHook(({ data }) => useAutoSave(data), {
      initialProps: { data: initialData },
    });

    rerender({ data: data2 });
    vi.advanceTimersByTime(200);
    rerender({ data: data3 });
    vi.advanceTimersByTime(200);

    // Still inside debounce window, then unmount.
    unmount();

    expect(mockedSetStorageItem).toHaveBeenCalledTimes(1);
    expect(mockedSetStorageItem).toHaveBeenCalledWith(
      STORAGE_KEYS.RESUME_DATA,
      data3
    );
  });
});
