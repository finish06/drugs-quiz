import { describe, it, expect } from "vitest";
import { getTableColumns } from "drizzle-orm";
import { users, quizSessions, quizTypeEnum } from "./schema.js";
import type { User, NewUser, QuizSession, NewQuizSession, QuizType } from "./schema.js";

describe("AC-002: users table schema", () => {
  it("should have all required columns", () => {
    const columns = getTableColumns(users);
    expect(columns).toHaveProperty("id");
    expect(columns).toHaveProperty("email");
    expect(columns).toHaveProperty("name");
    expect(columns).toHaveProperty("avatarUrl");
    expect(columns).toHaveProperty("oauthProvider");
    expect(columns).toHaveProperty("createdAt");
    expect(columns).toHaveProperty("updatedAt");
  });

  it("should have id as UUID with default", () => {
    const columns = getTableColumns(users);
    expect(columns.id.dataType).toBe("string");
    expect(columns.id.hasDefault).toBe(true);
    expect(columns.id.notNull).toBe(true);
  });

  it("should have email as not-null unique", () => {
    const columns = getTableColumns(users);
    expect(columns.email.notNull).toBe(true);
    expect(columns.email.isUnique).toBe(true);
  });

  it("should have name and avatarUrl as optional", () => {
    const columns = getTableColumns(users);
    expect(columns.name.notNull).toBe(false);
    expect(columns.avatarUrl.notNull).toBe(false);
  });

  it("should have oauthProvider as not-null", () => {
    const columns = getTableColumns(users);
    expect(columns.oauthProvider.notNull).toBe(true);
  });

  it("should have timestamps with defaults", () => {
    const columns = getTableColumns(users);
    expect(columns.createdAt.notNull).toBe(true);
    expect(columns.createdAt.hasDefault).toBe(true);
    expect(columns.updatedAt.notNull).toBe(true);
    expect(columns.updatedAt.hasDefault).toBe(true);
  });
});

describe("AC-003: quiz_sessions table schema", () => {
  it("should have all required columns", () => {
    const columns = getTableColumns(quizSessions);
    expect(columns).toHaveProperty("id");
    expect(columns).toHaveProperty("userId");
    expect(columns).toHaveProperty("quizType");
    expect(columns).toHaveProperty("questionCount");
    expect(columns).toHaveProperty("correctCount");
    expect(columns).toHaveProperty("percentage");
    expect(columns).toHaveProperty("completedAt");
    expect(columns).toHaveProperty("answersJson");
  });

  it("should have id as UUID with default", () => {
    const columns = getTableColumns(quizSessions);
    expect(columns.id.dataType).toBe("string");
    expect(columns.id.hasDefault).toBe(true);
    expect(columns.id.notNull).toBe(true);
  });

  it("should have userId as not-null", () => {
    const columns = getTableColumns(quizSessions);
    expect(columns.userId.notNull).toBe(true);
  });

  it("should have all numeric fields as not-null", () => {
    const columns = getTableColumns(quizSessions);
    expect(columns.questionCount.notNull).toBe(true);
    expect(columns.correctCount.notNull).toBe(true);
    expect(columns.percentage.notNull).toBe(true);
  });

  it("should have completedAt as not-null", () => {
    const columns = getTableColumns(quizSessions);
    expect(columns.completedAt.notNull).toBe(true);
  });

  it("should have answersJson as not-null JSONB", () => {
    const columns = getTableColumns(quizSessions);
    expect(columns.answersJson.notNull).toBe(true);
    expect(columns.answersJson.dataType).toBe("json");
  });
});

describe("AC-004: quiz_type enum", () => {
  it("should contain all 4 valid quiz types", () => {
    const values = quizTypeEnum.enumValues;
    expect(values).toContain("name-the-class");
    expect(values).toContain("match-drug-to-class");
    expect(values).toContain("brand-generic-match");
    expect(values).toContain("quick-5");
    expect(values).toHaveLength(4);
  });
});

describe("AC-012: schema types are exported", () => {
  it("should export User type with correct shape", () => {
    // Type-level test: if this compiles, the types exist
    const _user: User = {
      id: "uuid",
      email: "test@example.com",
      name: "Test User",
      avatarUrl: "https://example.com/avatar.jpg",
      oauthProvider: "google",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(_user.email).toBe("test@example.com");
  });

  it("should export NewUser type allowing optional fields", () => {
    const _newUser: NewUser = {
      email: "test@example.com",
      oauthProvider: "google",
    };
    expect(_newUser.email).toBe("test@example.com");
    // id, name, avatarUrl, createdAt, updatedAt should all be optional for inserts
  });

  it("should export QuizSession type with correct shape", () => {
    const _session: QuizSession = {
      id: "uuid",
      userId: "user-uuid",
      quizType: "name-the-class",
      questionCount: 10,
      correctCount: 7,
      percentage: 70.0,
      completedAt: new Date(),
      answersJson: [],
    };
    expect(_session.quizType).toBe("name-the-class");
  });

  it("should export NewQuizSession type for inserts", () => {
    const _newSession: NewQuizSession = {
      userId: "user-uuid",
      quizType: "quick-5",
      questionCount: 5,
      correctCount: 3,
      percentage: 60.0,
      completedAt: new Date(),
      answersJson: [{ questionIndex: 0, correct: true }],
    };
    expect(_newSession.quizType).toBe("quick-5");
  });

  it("should export QuizType union type", () => {
    const types: QuizType[] = [
      "name-the-class",
      "match-drug-to-class",
      "brand-generic-match",
      "quick-5",
    ];
    expect(types).toHaveLength(4);
  });
});

describe("AC-005: answersJson stores AnswerDetail[] shape", () => {
  it("should accept AnswerDetail-shaped JSONB data in NewQuizSession type", () => {
    const answerDetails = [
      {
        questionIndex: 0,
        correct: true,
        question: {
          kind: "multiple-choice",
          drugName: "Metformin",
          correctAnswer: "Biguanides",
          options: ["Biguanides", "Sulfonylureas", "DPP-4 Inhibitors", "GLP-1 Agonists"],
        },
        userAnswer: "Biguanides",
      },
      {
        questionIndex: 1,
        correct: false,
        question: {
          kind: "matching",
          leftItems: ["Lisinopril", "Amlodipine"],
          rightItems: ["ACE Inhibitors", "Calcium Channel Blockers"],
          correctPairs: { Lisinopril: "ACE Inhibitors", Amlodipine: "Calcium Channel Blockers" },
        },
        userAnswer: { Lisinopril: "Calcium Channel Blockers", Amlodipine: "ACE Inhibitors" },
      },
    ];

    const _session: NewQuizSession = {
      userId: "user-uuid",
      quizType: "name-the-class",
      questionCount: 2,
      correctCount: 1,
      percentage: 50.0,
      completedAt: new Date(),
      answersJson: answerDetails,
    };
    expect(_session.answersJson).toEqual(answerDetails);
  });
});
