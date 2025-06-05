import spacy
from spacy.tokens import DocBin
import random

# 1. Load a blank model (or an existing one if you want to fine-tune/add entities)
# Using 'en' creates a blank English pipeline with a tokenizer.
# If you start from 'en_core_web_sm', it will have existing components.
nlp = spacy.blank("en") # or spacy.load("en_core_web_sm")

# Your TRAIN_DATA (as shown above)
TRAIN_DATA = [
    ("Google's CEO Sundar Pichai announced a new AI initiative.", {"entities": [(0, 6, "ORG"), (11, 24, "PERSON")]}),
    ("Apple is looking at buying U.K. startup for $1 billion.", {"entities": [(0, 5, "ORG"), (27, 31, "GPE"), (44, 54, "MONEY")]}),
    ("Tesla, Inc. is an American electric vehicle and clean energy company.", {"entities": [(0, 11, "ORG"), (19, 27, "GPE")]}),
    ("The Olympic Games will be held in Paris in 2024.", {"entities": [(4, 17, "EVENT"), (31, 36, "GPE"), (40, 44, "DATE")]}),
    ("SpaceX launched a new rocket from Florida.", {"entities": [(0, 7, "ORG"), (31, 38, "GPE")]}),
    ("Elon Musk is the CEO of SpaceX.", {"entities": [(0, 9, "PERSON"), (23, 30, "ORG")]}),
    ("Tim Cook works for Apple Inc.", {"entities": [(0, 8, "PERSON"), (20, 29, "ORG")]}),
    ("The Eiffel Tower is in Paris.", {"entities": [(4, 17, "LOC"), (24, 29, "GPE")]}),
    ("Amazon was founded by Jeff Bezos.", {"entities": [(0, 6, "ORG"), (21, 31, "PERSON")]}),
    ("Microsoft released a new Windows update.", {"entities": [(0, 9, "ORG"), (23, 30, "PRODUCT")]})
]

# Split into train and dev sets (important for real-world training)
random.shuffle(TRAIN_DATA)
TRAIN_RATIO = 0.8
train_split_index = int(len(TRAIN_DATA) * TRAIN_RATIO)
train_set = TRAIN_DATA[:train_split_index]
dev_set = TRAIN_DATA[train_split_index:]


def convert_data_to_docbin(data, nlp_model):
    db = DocBin()
    for text, annot in data:
        doc = nlp_model.make_doc(text)
        entities = []
        for start, end, label in annot["entities"]:
            span = doc.char_span(start, end, label=label, alignment_mode="strict")
            if span is None:
                print(f"Skipping entity: ({start}, {end}, {label}) for text: '{text}' due to misalignment.")
            else:
                entities.append(span)
        doc.ents = entities
        db.add(doc)
    return db

# Convert training data
db_train = convert_data_to_docbin(train_set, nlp)
db_train.to_disk("./train.spacy")

# Convert development data
db_dev = convert_data_to_docbin(dev_set, nlp)
db_dev.to_disk("./dev.spacy")

print(f"Training data saved to train.spacy ({len(train_set)} examples)")
print(f"Development data saved to dev.spacy ({len(dev_set)} examples)")