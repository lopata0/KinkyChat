import spacy

# Load the best model from the training output directory
#nlp_trained = spacy.load("./output/model-best") # or model-last
nlp_trained = spacy.load("en_core_web_sm")

# Test it
text1 = "nods Of course, my apologies! Let's see... glances at your submissiveness and security level Ah yes, Exceptionally low and Exceptionally low. I think LatexMittens would be quite suitable for you. adds LatexMittens restraint There we are! You're now comfortably restrained."
doc1 = nlp_trained(text1)
print(f"\nEntities in '{text1}':")
for ent in doc1.ents:
    print(f"  - {ent.text} ({ent.label_})")

text2 = "Amazon announced a new drone delivery service in Seattle last week."
doc2 = nlp_trained(text2)
print(f"\nEntities in '{text2}':")
for ent in doc2.ents:
    print(f"  - {ent.text} ({ent.label_})")

text3 = "Barack Obama visited Berlin, Germany in 2017."
doc3 = nlp_trained(text3)
print(f"\nEntities in '{text3}':")
for ent in doc3.ents:
    print(f"  - {ent.text} ({ent.label_})")